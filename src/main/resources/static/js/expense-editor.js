/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
define(["require", "exports", 'js/model', "./model"], function (require, exports, model, model_1) {
    var ExpenseEditorCtrl = (function () {
        function ExpenseEditorCtrl($scope, expensesData, $timeout) {
            var _this = this;
            this.expensesData = expensesData;
            this.$timeout = $timeout;
            this.setDate = false;
            this.focusAmount = true;
            $scope.c = this;
            this.isAddition = $scope.isAddition;
            if ($scope.isAddition) {
                $scope.parent.setupAddExpense(this);
            }
            var categoryListener = function () { return _this.updateDisplayCategories(); };
            expensesData.onUpdateCategories(categoryListener);
            $scope.$on('$destroy', function () { return expensesData.removeOnUpdateCategories(categoryListener); });
        }
        ExpenseEditorCtrl.prototype.toggleDate = function () {
            this.setDate = !this.setDate;
            this.selectedDate = new Date();
            this.selectedTime = new Date();
        };
        ExpenseEditorCtrl.prototype.addExpense = function () {
            var _this = this;
            if (this.currentAmount < 0 || !this.currentAmount) {
                // Валидации у нас мало, так что можно так
                return;
            }
            var date;
            if (this.setDate) {
                date = new Date(this.selectedDate.getTime());
                date.setHours(this.selectedTime.getHours());
                date.setMinutes(this.selectedTime.getMinutes());
                date.setSeconds(this.selectedTime.getSeconds());
                date.setMilliseconds(this.selectedTime.getMilliseconds());
            }
            else {
                date = new Date();
            }
            this.expensesData.addExpense(new model_1.Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription, date));
            this.$timeout(function () {
                _this.currentAmount = null;
                _this.currentDescription = null;
                _this.focusAmount = true;
            }, 50);
        };
        ExpenseEditorCtrl.prototype.updateDisplayCategories = function () {
            var display = model.sortCategoriesByParent(this.expensesData.getCategories());
            if (this.isAddition) {
                this.displayCategories = display.concat([new model_1.ExpenseCategory('Настроить', null, true, 'setup')]);
            }
            console.log('updated', this.displayCategories);
        };
        ExpenseEditorCtrl.prototype.getCategory = function (uuid) {
            return this.expensesData.getCategory(uuid);
        };
        return ExpenseEditorCtrl;
    })();
    exports.ExpenseEditorCtrl = ExpenseEditorCtrl;
    function register(module) {
        module.directive('expenseEditor', function () {
            return {
                restriction: 'E',
                templateUrl: '/js/expense-editor.html',
                controller: ExpenseEditorCtrl,
                scope: {
                    isAddition: '=',
                    parent: '='
                },
                link: function (scope, element) {
                }
            };
        });
    }
    exports.register = register;
});
//# sourceMappingURL=expense-editor.js.map