'use strict';

const mongoose = require('mongoose');
const db = mongoose.connections[1];
const customId = require('mongoose-hook-custom-id');
const mongoosePaginate = require('mongoose-paginate');

var UserSch = new mongoose.Schema({
  _id : String,
  username : {type: String, require: true},
  password: {type: String, require: true},
  role: {type: Number, require: true},
  root_user: {type: Boolean, default: false},
  deleted: {type: Boolean, default: false},
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

UserSch.plugin(customId, {mongoose: mongoose});
UserSch.plugin(mongoosePaginate);

let User = db.model('users', UserSch);

// make this available to our users in our Node applications
module.exports = User;
