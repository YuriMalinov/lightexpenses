/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
define(["require", "exports", 'js/model', "./model"], function (require, exports, model, model_1) {
    var AddAlso = (function () {
        function AddAlso() {
            this.focus = false;
        }
        return AddAlso;
    })();
    var ExpenseEditorCtrl = (function () {
        function ExpenseEditorCtrl($scope, expensesData, $timeout, $window) {
            var _this = this;
            this.$scope = $scope;
            this.expensesData = expensesData;
            this.$timeout = $timeout;
            this.$window = $window;
            this.setDate = false;
            this.focusAmount = true;
            this.extraExpenses = [];
            $scope.c = this;
            if ($scope.edit) {
                this.edit = angular.copy($scope.edit);
                this.setDate = true;
                this.selectedDate = new Date(this.edit.date.getTime());
                this.selectedTime = new Date(this.edit.date.getTime());
                this.selectedTime.setSeconds(0);
                this.selectedTime.setMilliseconds(0);
                this.currentAmount = this.edit.amount;
                this.currentDescription = this.edit.description;
                this.selectedCategoryId = this.edit.categoryId;
            }
            else {
                $scope.parent.setupAddExpense(this);
            }
            var categoryListener = function () { return _this.updateDisplayCategories(); };
            expensesData.onUpdateCategories(categoryListener);
            $scope.$on('$destroy', function () { return expensesData.removeOnUpdateCategories(categoryListener); });
        }
        ExpenseEditorCtrl.prototype.toggleDate = function () {
            this.setDate = !this.setDate;
            if (!this.edit) {
                this.selectedDate = new Date();
                this.selectedTime = new Date();
                this.selectedTime.setSeconds(0);
                this.selectedTime.setMilliseconds(0);
            }
        };
        ExpenseEditorCtrl.prototype.save = function () {
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
            if (this.edit) {
                var e = this.edit;
                e.amount = this.currentAmount;
                e.categoryId = this.selectedCategoryId;
                e.description = this.currentDescription;
                e.date = date;
                this.expensesData.updateExpense(e);
            }
            else {
                var amount = this.currentAmount;
                var start = new Date().getTime();
                this.extraExpenses.forEach(function (extra, index) {
                    _this.expensesData.addExpense(new model_1.Expense(extra.expenseCategoryUuid, extra.amount, extra.description, date, new Date(start + index)), false);
                    amount -= extra.amount;
                });
                this.expensesData.addExpense(new model_1.Expense(this.selectedCategoryId, amount, this.currentDescription, date, new Date(start + this.extraExpenses.length)));
            }
            if (this.edit) {
                this.$scope.close();
            }
            else {
                this.$timeout(function () {
                    _this.currentAmount = null;
                    _this.currentDescription = null;
                    _this.focusAmount = true;
                    _this.extraExpenses = [];
                }, 50);
            }
        };
        ExpenseEditorCtrl.prototype.deleteExpense = function () {
            if (this.$window.confirm("Удалить расход?")) {
                this.expensesData.deleteExpense(this.edit);
            }
        };
        ExpenseEditorCtrl.prototype.addExtraExpense = function () {
            var extra = new AddAlso();
            extra.expenseCategoryUuid = this.selectedCategoryId;
            extra.focus = true;
            this.extraExpenses.push(extra);
        };
        ExpenseEditorCtrl.prototype.removeExtraExpense = function (index) {
            this.extraExpenses.splice(index, 1);
        };
        ExpenseEditorCtrl.prototype.updateDisplayCategories = function () {
            var display = model.sortCategoriesByParent(this.expensesData.getCategories());
            if (!this.edit) {
                display = display.concat([new model_1.ExpenseCategory('Настроить', null, true, 'setup')]);
            }
            this.displayCategories = display;
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
                    parent: '=',
                    edit: '=',
                    close: '&'
                },
                link: function (scope, element) {
                }
            };
        });
    }
    exports.register = register;
});
//# sourceMappingURL=expense-editor.js.map