(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer
  const storage = require('electron-json-storage')

  function HomeCtrl($scope, Notification) {
    let self = this;
    let default_bill = {
      ppn_percentage: 10,
      stamp: 0,
      is_service: false,
      dpp: 0,
      ppn: 0,
      pph_amount: 0,
      pph23: 0,
      dpp_ppn_stamp_pph23: 0
    };
    self.bill = angular.copy(default_bill);
    self.ppn_percentage = [10, 0];
    self.stamp = [{name:'6000', value:6000},
                  {name:'3000', value:3000},
                  {name:'Tidak Ada Materai', value:0}];

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
    self.create_bill = create_bill;
    self.count_ppn = count_ppn;
    self.count_pph23 = count_pph23;
    self.count_total = count_total;
    self.change_print_method = change_print_method;

    //events listener
    ipc.on('create-bill-response', function (event, arg) {
      if(arg.status === 200){
        self.bill = angular.copy(default_bill);
        $scope.bill_form.$setPristine();
        $scope.bill_form.$setUntouched();
        $scope.bill_form.$rollbackViewValue();
        Notification.success("Tanda Terima berhasil dibuat");
      }else if(arg.status === 400){
        Notification.error("Tanda Terima gagal dibuat");
      }
    });

    //events emitter
    function create_bill() {
      self.bill_print = {};
      self.bill_print = angular.copy(self.bill);
      ipc.send('create-bill', {
        bill: self.bill,
        print_method: self.print_method
      });
    }

    //private

    function change_print_method() {
      storage.set('printMethod', self.print_method, function (err) {
        if (err) return console.error(err)
      });
    }

    function count_ppn() {
      self.bill.ppn = (self.bill.ppn_percentage/100) * self.bill.dpp;
    }

    function count_pph23() {
      let pph23_value = 2;
      self.bill.pph23 = (pph23_value/100) * self.bill.pph_amount;
      // self.bill.pph23 = (pph23_value/100) * self.bill.dpp;
    }

    function count_total() {
      self.print_total = self.bill.dpp + self.bill.ppn + parseInt(self.bill.stamp);
      self.print_today = moment().toDate();
      self.bill.dpp_ppn_stamp_pph23 = self.bill.dpp + self.bill.ppn + parseInt(self.bill.stamp) - self.bill.pph23;
    }

  }


  HomeCtrl.$inject = ['$scope', 'Notification'];
  angular.module('grimapp')
    .controller('HomeCtrl', HomeCtrl);

})();
