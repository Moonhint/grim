(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer;
  const storage = require('electron-json-storage');

  function ReceiptHistoryCtrl($scope, Notification) {
    let self = this;

    //bindable function member
    self.open_file_manager = open_file_manager;

    //events listener
    ipc.on('get-receipt-storage-address-response', (event, arg)=>{
      self.receipt_storage_address = arg.data;
    });

    //events emitter
    ipc.send('get-receipt-storage-address');

    //private
    function open_file_manager() {
      ipc.send('show-grim-pdfs');
    }
  }


  ReceiptHistoryCtrl.$inject = ['$scope', 'Notification'];
  angular.module('grimapp')
    .controller('ReceiptHistoryCtrl', ReceiptHistoryCtrl);

})();
