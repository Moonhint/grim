(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer

  function CompensateDialogCtrl($scope, $mdDialog, Notification) {
    let self = this;

    self.month_filters = [
      {value: 0, display: 'Januari'},
      {value: 1, display: 'Februari'},
      {value: 2, display: 'Maret'},
      {value: 3, display: 'April'},
      {value: 4, display: 'Mei'},
      {value: 5, display: 'Juni'},
      {value: 6, display: 'Juli'},
      {value: 7, display: 'Agustus'},
      {value: 8, display: 'Sebtember'},
      {value: 9, display: 'Oktober'},
      {value: 10, display: 'November'},
      {value: 11, display: 'Desember'}
    ]

    self.year_filters = [];
    for(let i=0, len=100; i<len; i++){
      let year = moment().year(2016).add(i, 'years').year()
      self.year_filters.push({value: year, display: year.toString()})
    }

    self.filter_by_month = moment().month();
    self.filter_by_year = moment().year();

    self.save = save;
    self.cancel = cancel;

    function save() {
      let compensation_date = moment().year(self.filter_by_year).month(self.filter_by_month).date(1).toDate();
      $mdDialog.hide(compensation_date);
    };
    function cancel() {
      $mdDialog.cancel();
    };

  }

  CompensateDialogCtrl.$inject = ['$scope', '$mdDialog', 'Notification'];
  angular.module('grimapp')
    .controller('CompensateDialogCtrl', CompensateDialogCtrl);

})();
