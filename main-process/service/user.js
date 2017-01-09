'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const electron = require('electron');
const hashMd5 = require('./../hash');
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const shell = electron.shell;
const app = electron.app;


const _ = require('lodash');
const promise = require("bluebird");
const moment = require('moment');
const User = require('../model/user');
const PromiseUser = promise.promisifyAll(User);


/* ----- Init ------- */
//check for first admin, if none found, crete new one username: admin, password:admin
  User.find({username: 'admin', root_user: true})
    .then((root_user)=>{
      if(!root_user.length){
        User.create({username: 'admin', password: hashMd5('admin'), root_user: true, role: 1});
      }
    })
    .catch((error)=>{
      console.error(error);
    });

/* ------- End Init ------- */


function respond_with_result(event, channel_name) {
  return function(entity) {
    if (entity) {
      event.sender.send(channel_name, {status: 200, data: entity});
    }else{
      event.sender.send(channel_name, {status: 404, reason: 'Data Not Found!'});
    }
  };
}

function handle_error(event, channel_name) {
  return function(err) {
    let errorReason = err.toString();
    event.sender.send(channel_name, {status: 400, reason: errorReason});
  };
}


// Creates a new User in the DB
// ipc.on('create-user', (event, arg) => {
//   let reply_channel = 'create-user-response';
//   Bill.create(arg)
//     // .then(print_to_pdf(event, reply_channel))
//     .then(respond_with_result(event, reply_channel))
//     .catch(handle_error(event, reply_channel));
// });

// Check if user in DB
ipc.on('login-user', (event, arg)=>{
  let reply_channel = 'login-user-response';
  arg.password = hashMd5(arg.password);
  arg.deleted = false;
  User.findOne(arg)
    .then((user)=>{
      if(!user){
        throw new Error("Username atau password salah");
      }else{
        return user.toObject();
      }
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('create-employee', (event, arg)=>{
  let reply_channel = 'create-employee-response';
  User.findOne({username: arg.username, deleted: false})
    .then((user)=>{
      if(user){
        throw new Error("Sudah terdapat user dengan username ini");
        return false;
      }else{
        return true;
      }
    })
    .then((status)=>{
      if (status) {
        if(arg.password.length < 5) {
          throw new Error("Password terlalu pendek");
          return null;
        }else{
          return User.create({username: arg.username, password: hashMd5(arg.password), role: 2})
            .then((user)=>{
              return user.toObject();
            })
            .catch((error)=>{
              throw new Error("Gagal menyimpan data employee");
              return null;
            });
        }
      }
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('get-employees', (event,arg)=>{
  let reply_channel = 'get-employees-response';
  let options = {lean: true};
  if (arg){
    options.page = arg.page || 1;
    options.limit = arg.limit || 10;
    options.sort = arg.sort || {username: 1};
  }else{
    options.page = 1;
    options.limit = 10;
    options.sort = {username: 1};
  }

  User.paginate({role: 2, deleted: false}, options)
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
})

ipc.on('change-password', (event, arg)=>{
  let reply_channel = 'change-password-response';
  let new_password = arg.new_password;
  arg.old_password = hashMd5(arg.old_password);
  arg.new_password = hashMd5(arg.new_password);
  User.findOne({username: arg.username, password: arg.old_password, deleted: false})
    .then((user)=>{
      if(!user){
        throw new Error("Password lama salah");
      }else{
        return user;
      }
    })
    .then((user)=>{
      if(new_password.length < 5) {
        throw new Error("password baru terlalu pendek");
        return null;
      }else{
        user.password = arg.new_password;
        return user.save()
          .then((user)=>{
            return user.toObject();
          })
          .catch((error)=>{
            throw new Error("Gagal menyimpan");
            return null;
          });
      }
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('delete-user', (event, arg)=>{
  let reply_channel = 'delete-user-response';
  User.findById(arg).exec()
    .then((user)=>{
      if(!user){
        throw new Error("User tidak ditemukan");
      }else{
        return user;
      }
    })
    .then((user)=>{
      user.deleted = true;
      return user.save()
        .then((user)=>{
          return user.toObject();
        })
        .catch((error)=>{
          throw new Error("Gagal Menyimpan");
          return null;
        });
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});
