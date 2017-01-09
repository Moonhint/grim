'use strict';

const mongoose = require('mongoose');
const db = mongoose.connections[1];
const customId = require('mongoose-hook-custom-id');
const mongoosePaginate = require('mongoose-paginate');

var BillSch = new mongoose.Schema({
  _id : String,
  supplier_name : {type: String, required: true},
  supplier_npwp : {type: String, required: true},
  tax_invoice_number : {type: String, required: true},
  invoice_date : {type: Date, required: true},
  dpp: {type: Number, required: true},
  ppn_percentage: {type: Number, required: true},
  ppn: {type: Number, required: true},
  stamp: {type: Number},
  is_service: {type: Boolean, required: true},
  pph23: {type: Number},
  dpp_ppn_stamp_pph23: {type: Number},
  giro_number: String,
  giro_due_date: Date,
  bill_history: {type: String, ref: 'bill_histories'},
  is_compensate: {type: Boolean, default: false},
  compensation_date: {type: Date},
  is_deleted: {type: Boolean, default: false},
	created_at: {type: Date, default: Date.now},
	updated_at: {type: Date, default: Date.now}
});

BillSch.plugin(customId, {mongoose: mongoose});
BillSch.plugin(mongoosePaginate);

let Bill = db.model('bills', BillSch);

// make this available to our users in our Node applications
module.exports = Bill;
