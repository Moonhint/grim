(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer
  const storage = require('electron-json-storage')


  function AfterPaymentListCtrl($scope, $mdDialog, $mdSidenav, Notification) {
    let self = this;
    self.sort_tracker = {};
    self.mass_decompensation_ids = [];

    self.filter_by = 'created_at';
    self.by_date_filter = 'created_at';
    self.by_string_filter;
    self.by_number_filter;
    self.filters = [
      {value: 'created_at', display: 'Tanggal Tanda Terima'},
      {value: 'compensation_date', display: 'Kompensasi'},
      {value: 'invoice_date', display: 'Tanggal Invoice'},
      {value: 'supplier_name', display: 'Nama Supplier'},
      {value: 'supplier_npwp', display: 'NPWP Supplier'},
      {value: 'tax_invoice_number', display: 'No Seri'},
      {value: 'dpp', display: 'DPP'},
      {value: 'ppn', display: 'PPN'},
      {value: 'stamp', display: 'Materai'},
      {value: 'pph23', display: 'PPH23'},
      {value: 'giro_number', display: 'No Giro'},
      {value: 'giro_due_date', display: 'Jatuh Tempo Giro'}];

    self.month_filters = [
      {value: 'this_month', display: 'Bulan ini'},
      {value: 'last_month', display: 'Bulan Lalu'},
      {value: 'last_2_month', display: '2 Bulan Lalu'},
      {value: 'last_3_month', display: '3 Bulan Lalu'},
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

    self.filter_by_sign = 'least';
    self.sign_filters = [
      {value: 'least', display: '<='},
      {value: 'more', display: '>='}
    ]

    self.field_map = {
      'Tanggal Tanda Terima': true, 'Kompensasi': true,
      'Tanggal Invoice': true, 'Nama Supplier': true,
      'NPWP Supplier': true, 'No Seri': true,
      'DPP': true, 'Materai': false, 'PPN': true, 'PPH23': true,
      'No Giro': true, 'Jatuh Tempo Giro': true
    };
    //bindable function member
    self.page_change = page_change;
    self.sort_by = sort_by;
    self.find_by = find_by;
    self.find_by_spesific_date = find_by_spesific_date;
    self.find_by_string = find_by_string;
    self.find_by_number = find_by_number;
    self.mass_decompensation_select = mass_decompensation_select;
    self.is_on_mass_selection = is_on_mass_selection;
    self.mass_decompensation = mass_decompensation;
    self.decompensation = decompensation;
    self.change_filter = change_filter;
    self.toggle_expansion_field = toggle_expansion_field;
    self.extension_field_close = extension_field_close;
    self.change_field_extension = change_field_extension;
    self.delete_bill = delete_bill;
    self.edit_giro = edit_giro;

    //events listener
    ipc.on('get-bills-history-response', function (event, arg) {
      if(arg.status === 200){
        self.bills = arg.data.docs;
        self.pagination = arg.data;
        $scope.$apply();
      }else if(arg.status === 400){
        Notification.error("Terjadi kegagalan sistem");
      }
    });

    ipc.on('delete-bill-response', (event, arg) => {
      if(arg.status === 200){
        let query = {};
        query.is_compensate = true;
        if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
          if(self.spesific_start_date && self.spesific_end_date){
            query.start_date = self.spesific_start_date;
            query.end_date = self.spesific_end_date;
            if (self.by_date_filter){
              query.by_date_filter = self.by_date_filter;
            }
          }
        }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
          if(self.number_filter && self.filter_by_sign){
            query.number_filter = self.number_filter;
            query.filter_by_sign = self.filter_by_sign;
            if (self.by_number_filter){
              query.by_number_filter = self.by_number_filter;
            }
          }
        }else{
          if(self.string_filter){
            query.string_filter = self.string_filter;
            if (self.by_string_filter){
              query.by_string_filter = self.by_string_filter;
            }
          }
        }
        ipc.send('get-bills', query);
      }else{
        Notification.error("Gagal menghapus tagihan");
      }
    });

    ipc.on('decompensate-bills-response', function (event, arg) {
      if(arg.status === 200){
        let query = {};
        query.is_compensate = true;
        if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
          if(self.spesific_start_date && self.spesific_end_date){
            query.start_date = self.spesific_start_date;
            query.end_date = self.spesific_end_date;
            if (self.by_date_filter){
              query.by_date_filter = self.by_date_filter;
            }
          }
        }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
          if(self.number_filter && self.filter_by_sign){
            query.number_filter = self.number_filter;
            query.filter_by_sign = self.filter_by_sign;
            if (self.by_number_filter){
              query.by_number_filter = self.by_number_filter;
            }
          }
        }else{
          if(self.string_filter){
            query.string_filter = self.string_filter;
            if (self.by_string_filter){
              query.by_string_filter = self.by_string_filter;
            }
          }
        }
        ipc.send('get-bills', query);
        self.mass_decompensation_ids = [];
      }else if(arg.status === 400){
        Notification.error("Terjadi Kegagalan Sistem, Kompensasi Gagal");
      }
    });

    ipc.on('compensate-bills-response', function (event, arg) {
      if(arg.status === 200){
        let query = {};
        query.is_compensate = true;
        if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
          if(self.spesific_start_date && self.spesific_end_date){
            query.start_date = self.spesific_start_date;
            query.end_date = self.spesific_end_date;
            if (self.by_date_filter){
              query.by_date_filter = self.by_date_filter;
            }
          }
        }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
          if(self.number_filter && self.filter_by_sign){
            query.number_filter = self.number_filter;
            query.filter_by_sign = self.filter_by_sign;
            if (self.by_number_filter){
              query.by_number_filter = self.by_number_filter;
            }
          }
        }else{
          if(self.string_filter){
            query.string_filter = self.string_filter;
            if (self.by_string_filter){
              query.by_string_filter = self.by_string_filter;
            }
          }
        }
        ipc.send('get-bills', query);
      }else if(arg.status === 400){
        Notification.error("Terjadi Kegagalan Sistem, Kompensasi Gagal");
      }
    });

    ipc.on('edit-bill-response', function (event, arg){
      if(arg.status === 200){
        let new_bills = _.map(self.bills, function (bill){
          if(bill._id === arg.data._id){
            return arg.data;
          }else{
            return bill;
          }
        });
        self.bills = new_bills;
        $scope.$apply();
      }else if(arg.status === 400){
        Notification.error("Terjadi Kegagalan Sistem, Gagal Mengubah data");
      }
    });

    ipc.on('login-user-response', (event, arg)=>{
      self.current_user = arg.data;
      $scope.$apply();
    });

    //events emitter
    ipc.send('get-bills', {is_compensate: true});

    storage.get('current_user', (err, user)=>{
      if(user._id !== undefined){
        self.current_user = user;
      }
    });

    function page_change(page){
      let query = {};
      query.page = page;
      query.is_compensate = true;
      if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
        if(self.spesific_start_date && self.spesific_end_date){
          query.start_date = self.spesific_start_date;
          query.end_date = self.spesific_end_date;
          if (self.by_date_filter){
            query.by_date_filter = self.by_date_filter;
          }
        }
      }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
        if(self.number_filter && self.filter_by_sign){
          query.number_filter = self.number_filter;
          query.filter_by_sign = self.filter_by_sign;
          if (self.by_number_filter){
            query.by_number_filter = self.by_number_filter;
          }
        }
      }else{
        if(self.string_filter){
          query.string_filter = self.string_filter;
          if (self.by_string_filter){
            query.by_string_filter = self.by_string_filter;
          }
        }
      }
      if (self.current_sort){
        query.sort = {};
        query.sort[self.current_sort] = self.sort_tracker[self.current_sort];
      }
      ipc.send('get-bills', query);
    }

    function sort_by(pivot){
      let query = {};
      query.is_compensate = true;
      if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
        if(self.spesific_start_date && self.spesific_end_date){
          query.start_date = self.spesific_start_date;
          query.end_date = self.spesific_end_date;
          if (self.by_date_filter){
            query.by_date_filter = self.by_date_filter;
          }
        }
      }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
        if(self.number_filter && self.filter_by_sign){
          query.number_filter = self.number_filter;
          query.filter_by_sign = self.filter_by_sign;
          if (self.by_number_filter){
            query.by_number_filter = self.by_number_filter;
          }
        }
      }else{
        if(self.string_filter){
          query.string_filter = self.string_filter;
          if (self.by_string_filter){
            query.by_string_filter = self.by_string_filter;
          }
        }
      }
      switch (pivot) {
        case "created_at":
          if (self.sort_tracker.created_at === -1){
            query.sort = {created_at: 1};
            self.sort_tracker.created_at = 1;
          }else{
            query.sort = {created_at: -1};
            self.sort_tracker.created_at = -1;
          }
          self.current_sort = 'created_at';
          ipc.send('get-bills', query);
          break;
        case "compensation_date":
          if (self.sort_tracker.compensation_date === -1){
            query.sort = {compensation_date: 1};
            self.sort_tracker.compensation_date = 1;
          }else{
            query.sort = {compensation_date: -1};
            self.sort_tracker.compensation_date = -1;
          }
          self.current_sort = 'compensation_date';
          ipc.send('get-bills', query);
          break;
        case "invoice_date":
          if (self.sort_tracker.invoice_date === -1){
            query.sort = {invoice_date: 1};
            self.sort_tracker.invoice_date = 1;
          }else{
            query.sort = {invoice_date: -1};
            self.sort_tracker.invoice_date = -1;
          }
          self.current_sort = 'invoice_date';
          ipc.send('get-bills', query);
          break;
        case "supplier_name":
          if (self.sort_tracker.supplier_name === -1){
            query.sort = {supplier_name: 1};
            self.sort_tracker.supplier_name = 1;
          }else{
            query.sort = {supplier_name: -1};
            self.sort_tracker.supplier_name = -1;
          }
          self.current_sort = 'supplier_name';
          ipc.send('get-bills', query);
          break;
        case "supplier_npwp":
          if (self.sort_tracker.supplier_npwp === -1){
            query.sort = {supplier_npwp: 1};
            self.sort_tracker.supplier_npwp = 1;
          }else{
            query.sort = {supplier_npwp: -1};
            self.sort_tracker.supplier_npwp = -1;
          }
          self.current_sort = 'supplier_npwp';
          ipc.send('get-bills', query);
          break;
        case "tax_invoice_number":
          if (self.sort_tracker.tax_invoice_number === -1){
            query.sort = {tax_invoice_number: 1};
            self.sort_tracker.tax_invoice_number = 1;
          }else{
            query.sort = {tax_invoice_number: -1};
            self.sort_tracker.tax_invoice_number = -1;
          }
          self.current_sort = 'tax_invoice_number';
          ipc.send('get-bills', query);
          break;
        case "dpp":
          if (self.sort_tracker.dpp === -1){
            query.sort = {dpp: 1};
            self.sort_tracker.dpp = 1;
          }else{
            query.sort = {dpp: -1};
            self.sort_tracker.dpp = -1;
          }
          self.current_sort = 'dpp';
          ipc.send('get-bills', query);
          break;
        case "ppn":
          if (self.sort_tracker.ppn === -1){
            query.sort = {ppn: 1};
            self.sort_tracker.ppn = 1;
          }else{
            query.sort = {ppn: -1};
            self.sort_tracker.ppn = -1;
          }
          self.current_sort = 'ppn';
          ipc.send('get-bills', query);
          break;
        case "stamp":
          if (self.sort_tracker.stamp === -1){
            query.sort = {stamp: 1};
            self.sort_tracker.stamp = 1;
          }else{
            query.sort = {stamp: -1};
            self.sort_tracker.stamp = -1;
          }
          self.current_sort = 'stamp';
          ipc.send('get-bills', query);
          break;
        case "pph23":
          if (self.sort_tracker.pph23 === -1){
            query.sort = {pph23: 1};
            self.sort_tracker.pph23 = 1;
          }else{
            query.sort = {pph23: -1};
            self.sort_tracker.pph23 = -1;
          }
          self.current_sort = 'pph23';
          ipc.send('get-bills', query);
          break;
        case "giro_number":
          if (self.sort_tracker.giro_number === -1){
            query.sort = {giro_number: 1};
            self.sort_tracker.giro_number = 1;
          }else{
            query.sort = {giro_number: -1};
            self.sort_tracker.giro_number = -1;
          }
          self.current_sort = 'giro_number';
          ipc.send('get-bills', query);
          break;
        case "giro_due_date":
          if (self.sort_tracker.giro_due_date === -1){
            query.sort = {giro_due_date: 1};
            self.sort_tracker.giro_due_date = 1;
          }else{
            query.sort = {giro_due_date: -1};
            self.sort_tracker.giro_due_date = -1;
          }
          self.current_sort = 'giro_due_date';
          ipc.send('get-bills', query);
          break;
        default:
      }
    }

    function change_filter() {
      if (self.filter_by === 'created_at' || self.filter_by === 'compensation_date' || self.filter_by === 'invoice_date' || self.filter_by === 'giro_due_date'){
        self.by_date_filter = self.filter_by;
        self.by_string_filter = undefined;
        self.string_filter = undefined;
        self.by_number_filter = undefined;
        self.filter_by_sign = 'least';
        self.number_filter = undefined;
        self.find_by_spesific_date();
      }else if (self.filter_by === 'dpp' || self.filter_by === 'ppn' || self.filter_by === 'pph23' || self.filter_by === 'stamp'){
        self.by_number_filter = self.filter_by;
        self.by_date_filter = undefined;
        self.filter_by_month = undefined;
        self.spesific_start_date = undefined;
        self.spesific_end_date = undefined;
        self.by_string_filter = undefined;
        self.string_filter = undefined;
        self.find_by_number();
      }else{
        self.by_string_filter = self.filter_by;
        self.by_date_filter = undefined;
        self.filter_by_month = undefined;
        self.spesific_start_date = undefined;
        self.spesific_end_date = undefined;
        self.by_number_filter = undefined;
        self.filter_by_sign = 'least';
        self.number_filter = undefined;
        self.find_by_string();
      }
    }

    function find_by(pivot){
      let query = {};
      query.is_compensate = true;
      switch (pivot) {
        case "this_month":
          query.start_date = moment().startOf('month').toDate();
          query.end_date = moment().endOf('month').toDate();
          break;
        case "last_month":
          query.start_date = moment().subtract(1, 'months').startOf('month').toDate();
          query.end_date = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case "last_2_month":
          query.start_date = moment().subtract(2, 'months').startOf('month').toDate();
          query.end_date = moment().subtract(2, 'months').endOf('month').toDate();
          break;
        case "last_3_month":
          query.start_date = moment().subtract(3, 'months').startOf('month').toDate();
          query.end_date = moment().subtract(3, 'months').endOf('month').toDate();
          break;
        default:
          query.start_date = moment().startOf('year').add(pivot, 'M').startOf('month').toDate();
          query.end_date = moment().startOf('year').add(pivot, 'M').endOf('month').toDate();
      }

      if (self.by_date_filter){
        query.by_date_filter = self.by_date_filter;
        self.spesific_start_date = query.start_date;
        self.spesific_end_date = query.end_date;
      }

      if (self.by_string_filter){
        query.by_string_filter = self.by_string_filter;
        query.string_filter = self.string_filter;
      }

      ipc.send('get-bills', query);
    }

    function find_by_string() {
      let query = {};
      query.is_compensate = true;
      if (self.by_string_filter){
        query.by_string_filter = self.by_string_filter;
        query.string_filter = self.string_filter;
      }
      ipc.send('get-bills', query);
    }

    function find_by_spesific_date(){
      if (self.spesific_start_date && self.spesific_end_date){
        let query = {};
        query.is_compensate = true;
        query.start_date = self.spesific_start_date;
        query.end_date = moment(self.spesific_end_date).endOf('date').toDate();
        if (self.by_date_filter){
          query.by_date_filter = self.by_date_filter;
        }
        ipc.send('get-bills', query);
      }
    }

    function find_by_number() {
      if(self.number_filter && self.filter_by_sign){
        let query = {};
        query.is_compensate = true;
        query.number_filter = self.number_filter;
        query.filter_by_sign = self.filter_by_sign;
        if (self.by_number_filter){
          query.by_number_filter = self.by_number_filter;
        }
        ipc.send('get-bills', query);
      }
    }

    function mass_decompensation_select(bill){
      self.mass_decompensation_ids = _.uniq(self.mass_decompensation_ids);
      if (_.indexOf(self.mass_decompensation_ids, bill._id) === -1){
        self.mass_decompensation_ids.push(bill._id);
      }else{
        self.mass_decompensation_ids = _.pull(self.mass_decompensation_ids, bill._id);
      }
    }

    function is_on_mass_selection(bill){
      if(_.indexOf(self.mass_decompensation_ids, bill._id) !== -1) {
        return true;
      }else{
        return false;
      }
    }

    function mass_decompensation() {
      ipc.send('decompensate-bills', self.mass_decompensation_ids);
    }

    function decompensation(bill) {
      ipc.send('decompensate-bills', [bill._id]);
    }

    function toggle_expansion_field() {
      $mdSidenav('righta').toggle();
    }

    function extension_field_close() {
      $mdSidenav('righta').close();
    }

    function change_field_extension(field) {
      self.field_map[field] = !self.field_map[field];
    }

    function delete_bill(data) {
      ipc.send('delete-bill', data._id);
    }

    function edit_giro(last_bill, ev) {
      $mdDialog.show({
        controller: 'EditGiroDialogCtrl',
        controllerAs: 'egdc',
        templateUrl: './renderer-process/lists/actions/edit-giro-dialog/dialog.tmpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        fullscreen: false,
        locals: {last_bill: last_bill}
      })
      .then(function(edited_bill) {
        ipc.send('edit-bill', edited_bill);
      }, function() {
        console.info("cancel");
      });
    }

  }


  AfterPaymentListCtrl.$inject = ['$scope', '$mdDialog', '$mdSidenav', 'Notification'];
  angular.module('grimapp')
    .controller('AfterPaymentListCtrl', AfterPaymentListCtrl);

})();
