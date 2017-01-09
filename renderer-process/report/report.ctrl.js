(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer;
  const storage = require('electron-json-storage');

  function ReportCtrl($scope, Notification) {
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
      let year = moment().year(2016).add(i, 'years').year();
      self.year_filters.push({value: year, display: year.toString()});
    }

    self.type_filters = [
      {value: 'invoice_date', display: 'Tanggal Invoice'},
      {value: 'compensation_date', display: 'Tanggal Kompensasi'}
    ]

    self.parts = {
      part_one: true,
      part_two: true,
      part_three: true,
      part_four: true
    };

    self.filter_by_month = moment().month();
    self.filter_by_year = moment().year();

    self.filter_by_type = 'invoice_date';
    self.disable_by_type = false;


    self.bills = {};

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
    self.print_report = print_report;
    self.change_print_method = change_print_method;
    self.toggle = toggle;
    self.is_indeterminate = is_indeterminate;
    self.toggle_all = toggle_all;
    self.select_type = select_type;

    //events listener
    ipc.on('get-report-by-giro-response', (event, arg)=>{
      self.bills = arg.data;
      console.info(arg.data);
      $scope.$apply();
      ipc.send('print-report-by-method', { print_method: self.print_method });
    });

    //events emitter
    // ipc.send('get-receipt-storage-address');

    //private
    function print_report() {
      self.start_date = moment().year(self.filter_by_year).month(self.filter_by_month).startOf('M').format('D-MM-YYYY');
      self.end_date = moment().year(self.filter_by_year).month(self.filter_by_month).endOf('M').format('D-MM-YYYY');
      ipc.send('get-report-by-giro', {
        year: self.filter_by_year,
        month: self.filter_by_month,
        type_filter: self.filter_by_type
      });
    }

    function change_print_method() {
      storage.set('printMethod', self.print_method, function (err) {
        if (err) return console.error(err)
      });
    }

    function toggle(part_name) {
      self.parts[part_name] = !self.parts[part_name];
    }

    function is_indeterminate() {
      if(self.disable_by_type) {
        if (self.parts.part_three && self.parts.part_four){
          return false;
        }else{
          return true;
        }
      }else{
        if (self.parts.part_one && self.parts.part_two && self.parts.part_three && self.parts.part_four){
          return false;
        }else{
          return true;
        }
      }

    }

    function toggle_all() {
      if(self.is_indeterminate()){
        if (!self.disable_by_type) {
          self.parts.part_one = true;
          self.parts.part_two = true;
        }
        self.parts.part_three = true;
        self.parts.part_four = true;
      }else{
        self.parts.part_one = false;
        self.parts.part_two = false;
        self.parts.part_three = false;
        self.parts.part_four = false;
      }
    }

    function select_type(type) {
      if(type === 'compensation_date') {
        self.parts.part_one = false;
        self.parts.part_two = false;
        self.disable_by_type = true;
      }else{
        self.disable_by_type = false;
      }
    }
  }


  ReportCtrl.$inject = ['$scope', 'Notification'];
  angular.module('grimapp')
    .controller('ReportCtrl', ReportCtrl);

})();
