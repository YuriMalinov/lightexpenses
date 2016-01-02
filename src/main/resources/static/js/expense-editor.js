/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
define(["require", "exports"], function (require, exports) {
    /**
     * TODO, надо собственно перенести сюда причитающуюся сюда часть из основного контроллера. Пока что всё работает за счёт наследования Scope-ов
     */
    var ExpenseEditorCtrl = (function () {
        function ExpenseEditorCtrl($scope) {
            $scope.e = this;
        }
        return ExpenseEditorCtrl;
    })();
    function register(module) {
        module.directive('expenseEditor', function () {
            return {
                restriction: 'E',
                templateUrl: '/js/expense-editor.html',
                controller: ExpenseEditorCtrl
            };
        });
    }
    exports.register = register;
});
//# sourceMappingURL=expense-editor.js.map