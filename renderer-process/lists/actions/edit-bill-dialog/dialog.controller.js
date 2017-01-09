(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer
  const storage = require('electron-json-storage')

  function EditBillDialogCtrl($scope, $mdDialog, Notification, last_bill, current_user) {
    let self = this;
    last_bill.invoice_date = moment(last_bill.invoice_date).toDate();
    if (last_bill.giro_due_date){
      last_bill.giro_due_date = moment(last_bill.giro_due_date).toDate();
    }
    let default_bill = last_bill;
    self.bill = angular.copy(default_bill);
    self.ppn_percentage = [10, 0];
    self.stamp = [{name:'6000', value:6000},
                  {name:'3000', value:3000},
                  {name:'Tidak Ada Materai', value:0}];
    self.bill.pph_amount = (last_bill.pph23 * 100) / 2;
    self.current_user = current_user;

    storage.get('printMethod', function (err, method) {
      if (err) return console.error(err)
      if(method){
        self.print_method = method;
      }else{
        self.print_method = 'print-to-pdf';
      }
    });

    self.print_methods = [
      { value: 'print-to-pdf', display: 'Sebagai PDF' },
      { value: 'using-printer', display: 'Printer Default' },
      { value: 'just-save', display: 'Simpan Saja'}
    ];

    //bindable function member
    self.count_ppn = count_ppn;
    self.count_pph23 = count_pph23;
    self.count_total = count_total;
    self.save = save;
    self.print_and_save = print_and_save;
    self.cancel = cancel;
    self.change_print_method = change_print_method;

    function save() {
      $mdDialog.hide({
        bill: this.bill,
        print_object: undefined,
        print_method: undefined
      });
    };

    function print_and_save() {
      $mdDialog.hide({
        bill: this.bill,
        print_object: 'ok',
        print_method: self.print_method
      });
    };

    function cancel() {
      $mdDialog.cancel();
    };

    //private
    function count_ppn() {
      self.bill.ppn = (self.bill.ppn_percentage/100) * self.bill.dpp;
    }

    function count_pph23() {
      let pph23_value = 2;
      self.bill.pph23 = (pph23_value/100) * self.bill.pph_amount;
    }

    function count_total() {
      self.bill.dpp_ppn_stamp_pph23 = self.bill.dpp + self.bill.ppn + parseInt(self.bill.stamp) - self.bill.pph23;
    }

    function change_print_method() {
      storage.set('printMethod', self.print_method, function (err) {
        if (err) return console.error(err)
      });
    }

  }

  EditBillDialogCtrl.$inject = ['$scope', '$mdDialog', 'Notification', 'last_bill', 'current_user'];
  angular.module('grimapp')
    .controller('EditBillDialogCtrl', EditBillDialogCtrl);

})();
