'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const shell = electron.shell;
const app = electron.app;


const _ = require('lodash');
const promise = require("bluebird");
const moment = require('moment');
const Bill = require('../model/bill');
const PromiseBill = promise.promisifyAll(Bill);

/* ----- Init ------- */
//check printing to pdf directory if none found, create one
checkDirectory(`${app.getPath('documents')}/GrimPDFs`, function(error) {
  if(error) {
    fs.mkdirSync(`${app.getPath('documents')}/GrimPDFs`);
  } else {
    //Carry on, all good, directory exists / created.
  }
  app.setPath('documents', `${app.getPath('documents')}/GrimPDFs`);
});
/* ------- End Init ------- */


//function will check if a directory exists, and create it if it doesn't
function checkDirectory(directory, callback) {
  fs.stat(directory, function(err, stats) {
    //Check if error defined and the error code is "not exists"
    if (err && err.errno === 34) {
      //Create the directory, call the callback.
      fs.mkdir(directory, callback);
    } else {
      //just in case there was a different error:
      callback(err)
    }
  });
}

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
    console.log(errorReason);
    event.sender.send(channel_name, {status: 400, reason: errorReason});
  };
}

ipc.on('print-by-method', (event, arg)=>{
  let pdfPath = '';
  if (arg.fresh_created){
    pdfPath = path.join(`${app.getPath('documents')}`, `${arg.bill._id}.pdf`);
  }else{
    let today = moment().format('D-MM-YYYY-HH-mm');
    pdfPath = path.join(`${app.getPath('documents')}`, `${arg.bill._id}-changed-${today}.pdf`);
  }
  const win = BrowserWindow.fromWebContents(event.sender);
  // Use default printing options
  win.webContents.printToPDF({}, function (error, data) {
    if (error) throw error
    fs.writeFile(pdfPath, data, function (error) {
      if (error) {
        throw error
      }
      if(arg.print_method === 'print-to-pdf'){
        shell.openExternal('file://' + pdfPath)
      }else if (arg.print_method === 'using-printer'){
        win.webContents.print();
      }
    });
  });
});

// Creates a new Bill in the DB
ipc.on('create-bill', (event, arg) => {
  let reply_channel = 'create-bill-response';
  Bill.create(arg.bill)
    .then((entity)=>{
      return {
        bill: entity.toObject(),
        print_method: arg.print_method
      };
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('get-bills', (event, arg) => {
  let reply_channel = 'get-bills-response';
  let query = {is_compensate: false, is_deleted: false};
  let options = {lean: true};
  if (arg){
    options.page = arg.page || 1;
    options.limit = arg.limit || 10;
    options.sort = arg.sort || {created_at: -1};
    if (arg.start_date !== undefined && arg.end_date !== undefined && arg.by_date_filter !== undefined){
      query[arg.by_date_filter] = {$gte: arg.start_date, $lte: arg.end_date};
    }
    if (arg.by_string_filter !== undefined && arg.string_filter !== undefined) {
      query[arg.by_string_filter] = new RegExp(arg.string_filter, 'i');
    }

    if (arg.by_number_filter !== undefined && arg.number_filter !== undefined && arg.filter_by_sign) {
      if (arg.filter_by_sign === 'least'){
        query[arg.by_number_filter] = {$lte: arg.number_filter};
      }else if (arg.filter_by_sign === 'more'){
        query[arg.by_number_filter] = {$gte: arg.number_filter};
      }
    }

    if (arg.is_compensate !== undefined) {
      query.is_compensate = arg.is_compensate;
      reply_channel = 'get-bills-history-response';
    }
    // if (arg.start_compensate_date !== undefined && arg.end_compensate_date !== undefined){
    //   query.compensation_date = {$gte: arg.start_compensate_date, $lt: arg.end_compensate_date};
    // }
  }else{
    options.page = 1;
    options.limit = 10;
    options.sort = {created_at: -1};
  }
  Bill.paginate(query, options)
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('compensate-bills', (event, arg) => {
  let reply_channel = 'compensate-bills-response';

  let bills = arg.bills;
  let compensate_date = arg.compensate_date;

  promise.map(bills, (bill_id)=>{
    return PromiseBill.findByIdAsync(bill_id)
      .then((bill)=>{
        bill.is_compensate = true;
        bill.compensation_date = compensate_date;
        return bill.save().then((bill)=>{
          return bill.toObject();
        });
      })
      .catch(handle_error(event, reply_channel));
  })
  .then(respond_with_result(event, reply_channel))
  .catch(handle_error(event, reply_channel));
});

ipc.on('decompensate-bills', (event, arg) => {
  let reply_channel = 'decompensate-bills-response';

  promise.map(arg, (bill_id)=>{
    return PromiseBill.findByIdAsync(bill_id)
      .then((bill)=>{
        bill.is_compensate = false;
        bill.compensation_date = undefined;
        return bill.save().then((bill)=>{
          return bill.toObject();
        });
      })
      .catch(handle_error(event, reply_channel));
  })
  .then(respond_with_result(event, reply_channel))
  .catch(handle_error(event, reply_channel));
});

ipc.on('edit-bill', (event, arg)=>{
  let reply_channel = 'edit-bill-response';
  Bill.findById(arg._id).exec()
    .then((bill)=>{
      if (arg._id) {
        delete arg._id;
      }
      var updated = _.merge(bill, arg);
      return updated.save()
        .then(updated => {
          return updated.toObject();
        });
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('delete-bill', (event, arg)=>{
  let reply_channel = 'delete-bill-response';
  Bill.findById(arg).exec()
    .then((bill)=>{
      if(bill){
        bill.is_deleted = true;
        return bill.save()
            .then((entity)=>{
              return entity.toObject();
            });
      }else{
        throw new Error("Tagihan tidak ditemukan");
        return null;
      }
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
});

ipc.on('get-receipt-storage-address', (event, arg)=>{
  let reply_channel = 'get-receipt-storage-address-response';
  event.sender.send(reply_channel, {status: 200, data: app.getPath('documents')});
});

ipc.on('show-grim-pdfs', (event, arg)=>{
  shell.showItemInFolder(app.getPath('documents'));
});

ipc.on('get-report-by-giro', (event, arg)=>{
  let reply_channel = 'get-report-by-giro-response';
  let start_date = moment().year(arg.year).month(arg.month).startOf('M').toDate();
  let end_date = moment().year(arg.year).month(arg.month).endOf('M').toDate();
  let total_dpp_no_giro_no_compensated = 0;
  let total_dpp_no_giro_compensated = 0;
  let total_dpp_with_giro_no_compensated = 0;
  let total_dpp_with_giro_compensated = 0;

  let no_giro_no_compensated_options = {
    is_deleted: false,
    giro_number: { $in: ["", undefined]},
    is_compensate: false
  }
  no_giro_no_compensated_options[arg.type_filter] = {$gte: start_date, $lte: end_date};

  let no_giro_compensated_options = {
    is_deleted: false,
    invoice_date: {$gte: start_date, $lte: end_date},
    giro_number: { $in: ["", undefined]},
    is_compensate: true
  }
  no_giro_compensated_options[arg.type_filter] = {$gte: start_date, $lte: end_date};

  let with_giro_no_compensated_options = {
    is_deleted: false,
    invoice_date: {$gte: start_date, $lte: end_date},
    giro_number: { $nin: ["", undefined]},
    is_compensate: false
  }
  with_giro_no_compensated_options[arg.type_filter] = {$gte: start_date, $lte: end_date};

  let with_giro_compensated_options = {
    is_deleted: false,
    invoice_date: {$gte: start_date, $lte: end_date},
    giro_number: { $nin: ["", undefined]},
    is_compensate: true
  }
  with_giro_compensated_options[arg.type_filter] = {$gte: start_date, $lte: end_date};

  Bill.find(no_giro_no_compensated_options)
    .then((no_giro_no_compensated_bills)=>{
      let flatten_docs = [];
      for(let i=0, len=no_giro_no_compensated_bills.length; i<len; i++){
        total_dpp_no_giro_no_compensated = total_dpp_no_giro_no_compensated + no_giro_no_compensated_bills[i].dpp;
        flatten_docs.push(no_giro_no_compensated_bills[i].toObject());
      }
      return flatten_docs;
    })
    .then((bills)=>{
      return Bill.find(no_giro_compensated_options)
        .then((no_giro_compensated_bills)=>{
          let flatten_docs = [];
          for(let i=0, len=no_giro_compensated_bills.length; i<len; i++){
            total_dpp_no_giro_compensated = total_dpp_no_giro_compensated + no_giro_compensated_bills[i].dpp;
            flatten_docs.push(no_giro_compensated_bills[i].toObject());
          }
          return {
            no_giro_no_compensated_bills: bills,
            no_giro_compensated_bills: flatten_docs
          }
        })
        .catch((error)=>{
          throw new Error('Gagal memproses tagihan tanpa giro terkompensasi');
        });
    })
    .then((bills)=>{
      return Bill.find(with_giro_no_compensated_options)
        .then((with_giro_no_compensated_bills)=>{
          let flatten_docs = [];
          for(let i=0, len=with_giro_no_compensated_bills.length; i<len; i++){
            total_dpp_with_giro_no_compensated = total_dpp_with_giro_no_compensated + with_giro_no_compensated_bills[i].dpp;
            flatten_docs.push(with_giro_no_compensated_bills[i].toObject());
          }
          return {
            no_giro_no_compensated_bills: bills.no_giro_no_compensated_bills,
            no_giro_compensated_bills: bills.no_giro_compensated_bills,
            with_giro_no_compensated_bills: flatten_docs
          }
        })
        .catch((error)=>{
          throw new error('Gagal memproses tagihan dengan giro tanpa kompensasi');
        });
    })
    .then((bills)=>{
      return Bill.find(with_giro_compensated_options)
        .then((with_giro_compensated_bills)=>{
          let flatten_docs = [];
          for(let i=0, len=with_giro_compensated_bills.length; i<len; i++){
            total_dpp_with_giro_compensated = total_dpp_with_giro_compensated + with_giro_compensated_bills[i].dpp;
            flatten_docs.push(with_giro_compensated_bills[i].toObject());
          }
          return {
            no_giro_no_compensated_bills: bills.no_giro_no_compensated_bills,
            total_dpp_no_giro_no_compensated: total_dpp_no_giro_no_compensated,
            no_giro_compensated_bills: bills.no_giro_compensated_bills,
            total_dpp_no_giro_compensated: total_dpp_no_giro_compensated,
            with_giro_no_compensated_bills: bills.with_giro_no_compensated_bills,
            total_dpp_with_giro_no_compensated: total_dpp_with_giro_no_compensated,
            with_giro_compensated_bills: flatten_docs,
            total_dpp_with_giro_compensated: total_dpp_with_giro_compensated
          }
        })
        .catch((error)=>{
          throw new error('Gagal memproses tagihan dengan giro terkompensasi');
        });
    })
    .then(respond_with_result(event, reply_channel))
    .catch(handle_error(event, reply_channel));
})

ipc.on('print-report-by-method', (event, arg)=>{
  let today = moment().format('D-MM-YYYY-HH-mm');
  let time_stamp = moment().valueOf();

  let pdfPath = path.join(`${app.getPath('documents')}`, `Report-Pembayaran-${today}-${time_stamp}.pdf`);
  const win = BrowserWindow.fromWebContents(event.sender);
  // Use default printing options
  win.webContents.printToPDF({landscape: true}, function (error, data) {
    if (error) throw error
    fs.writeFile(pdfPath, data, function (error) {
      if (error) {
        throw error
      }
      if(arg.print_method === 'print-to-pdf'){
        shell.openExternal('file://' + pdfPath)
      }else if (arg.print_method === 'using-printer'){
        win.webContents.print();
      }
    });
  });
});
