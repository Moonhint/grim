(()=>{
'use strict';
  const ipc = require('electron').ipcRenderer
  const storage = require('electron-json-storage')

  function LoginCtrl($scope, Notification) {
    let self = this;
    self.is_login = false;
    self.current_user = {};
    self.user = {
      username: '',
      password: ''
    }

    //bindable function member
    self.logout = logout;
    self.login = login;
    self.create_employee = create_employee;
    self.page_change = page_change;
    self.delete_employee = delete_employee;
    self.change_password = change_password;


    //events listener
    ipc.on('login-user-response', function(event, arg){
        if(arg.status === 200) {
          storage.set('current_user', arg.data, function (err) {
            if (err) return console.error(err);
          });
          self.is_login = true;
          self.user = angular.copy({});
          self.current_user = arg.data;
          $scope.$apply();
        }else{
          Notification.error(arg.reason);
        }
    });

    ipc.on('get-employees-response', (event, arg)=>{
      if (arg.status === 200){
        self.employees = arg.data.docs;
        self.pagination = arg.data;
        $scope.$apply();
      }else{
        Notification.error(arg.reason);
      }
    });

    ipc.on('create-employee-response', function(event, arg){
      if(arg.status === 200){
        ipc.send('get-employees');
        self.add_employee = angular.copy({});
      }else{
        Notification.error(arg.reason);
      }
    });

    ipc.on('delete-user-response', (event, arg)=>{
      if(arg.status === 200){
        ipc.send('get-employees');
      }else{
        Notification.error(arg.reason);
      }
    });

    ipc.on('change-password-response', (event, arg)=>{
        if(arg.status === 200){
          Notification.success("Password berhasil diganti");
          self.change_password_data = angular.copy({});
        }else{
          Notification.error(arg.reason);
        }
    });

    ipc.send('get-employees');

    //events emitter
    storage.get('current_user', (err, user)=>{
      if(user._id !== undefined){
        self.is_login = true;
        self.current_user = user;
        $scope.$apply();
      }else {
        self.is_login = false;
        $scope.$apply();
      }
    });

    function login() {
      ipc.send('login-user', self.user);
    }

    function logout() {
      storage.remove('current_user', function (err) {
        if (err) return console.error(err);
        self.is_login = false;
        self.current_user = angular.copy({});
        Notification.success("Berhasil Logout");
      });
    }

    function create_employee() {
      ipc.send('create-employee', self.add_employee);
    }

    function delete_employee(data) {
      ipc.send('delete-user', data.id);
    }

    function page_change(page){
      let query = {};
      query.page = page;
      ipc.send('get-employees', query);
    }

    function change_password() {
      self.change_password_data.username = self.current_user.username;
      ipc.send('change-password', self.change_password_data);
    }

  }


  LoginCtrl.$inject = ['$scope', 'Notification'];
  angular.module('grimapp')
    .controller('LoginCtrl', LoginCtrl);

})();
