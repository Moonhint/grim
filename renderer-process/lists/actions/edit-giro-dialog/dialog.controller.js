(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer

  function EditGiroDialogCtrl($scope, $mdDialog, Notification, last_bill) {
    let self = this;
    last_bill.invoice_date = moment(last_bill.invoice_date).toDate();
    if (last_bill.giro_due_date){
      last_bill.giro_due_date = moment(last_bill.giro_due_date).toDate();
    }
    let default_bill = last_bill;
    self.bill = angular.copy(default_bill);

    self.save = save;
    self.cancel = cancel;

    function save() {
      $mdDialog.hide(this.bill);
    };
    function cancel() {
      $mdDialog.cancel();
    };

  }

  EditGiroDialogCtrl.$inject = ['$scope', '$mdDialog', 'Notification', 'last_bill'];
  angular.module('grimapp')
    .controller('EditGiroDialogCtrl', EditGiroDialogCtrl);

})();
