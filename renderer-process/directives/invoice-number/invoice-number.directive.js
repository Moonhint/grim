'use strict';

angular.module('grimapp')
  .directive('invoiceNumber', function() {
    return{
        restrict: 'A',
        // templateUrl: 'scripts/directives/directive_templates/directive.html',
        require: 'ngModel',
        link: function(scope, element, attr, ngModel){

            ngModel.$formatters.push(function(value){

            });

            ngModel.$parsers.push(function(value){
              if (value){
                let formated_value = construct_string(value);
                element.val(formated_value);
                return formated_value;
              }
            });

            function construct_string(value) {

              if(value.length === 3) {
                value = value + '.';
              }
              if(value.length === 7) {
                value = value + '-';
              }
              if(value.length === 10) {
                value = value + '.';
              }

              if(value.length >=20) {
                value = value.substr(0,19);
              }

              return value;
            }

        }
    };
  });
