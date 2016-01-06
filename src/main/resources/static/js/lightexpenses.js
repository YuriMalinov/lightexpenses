/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
define(["require", "exports", 'bower-libs/moment/moment', 'js/category-list', 'js/services', 'js/expense-editor'], function (require, exports, moment, categoryList, services, expenseEditor) {
    var StatisticsItem = (function () {
        function StatisticsItem(categoryId, amount, percent) {
            this.categoryId = categoryId;
            this.amount = amount;
            this.percent = percent;
        }
        return StatisticsItem;
    })();
    var PeriodType;
    (function (PeriodType) {
        PeriodType[PeriodType["CurrentWeek"] = 0] = "CurrentWeek";
        PeriodType[PeriodType["CurrentMonth"] = 1] = "CurrentMonth";
        PeriodType[PeriodType["CurrentYear"] = 2] = "CurrentYear";
        PeriodType[PeriodType["Specific"] = 3] = "Specific";
    })(PeriodType || (PeriodType = {}));
    var LightExpensesControllerDisplay = (function () {
        function LightExpensesControllerDisplay() {
            this.whyLogin = false;
        }
        return LightExpensesControllerDisplay;
    })();
    var LightExpensesController = (function () {
        function LightExpensesController($scope, $timeout, expensesStorage, expensesData, angularData, expensesSynchronizer) {
            var _this = this;
            this.$scope = $scope;
            this.$timeout = $timeout;
            this.expensesStorage = expensesStorage;
            this.expensesData = expensesData;
            this.angularData = angularData;
            this.expensesSynchronizer = expensesSynchronizer;
            this.displayExpensesNumber = 3;
            this.setupCategories = false;
            this.periodType = PeriodType.CurrentMonth;
            this.finishSetup = function (lastCategory) {
                if (_this.addExpenseCtrl) {
                    _this.addExpenseCtrl.selectedCategoryId = lastCategory ? lastCategory.uuid : _this.previousCategoryId;
                }
            };
            $scope.c = this;
            this.updatePeriod();
            expensesData.onUpdateExpenses(function () { return _this.updateDisplayExpenses(); });
            // manage selected cat and previous is done by main ctrl because we EditorCtlrs are less responsible...
            $scope.$watch(function () { return _this.addExpenseCtrl ? _this.addExpenseCtrl.selectedCategoryId : null; }, function (newValue, oldValue) {
                if (_this.addExpenseCtrl && _this.addExpenseCtrl.selectedCategoryId != 'setup') {
                    expensesStorage.saveLastSelectedCategory(_this.addExpenseCtrl.selectedCategoryId);
                }
                if (newValue != oldValue) {
                    _this.previousCategoryId = oldValue;
                }
                _this.setupCategories = newValue === 'setup';
            });
        }
        LightExpensesController.prototype.setupAddExpense = function (ctrl) {
            this.addExpenseCtrl = ctrl;
            ctrl.selectedCategoryId = this.expensesStorage.loadLastSelectedCategory();
            // NOTE: Expects listener to be called
            if (!ctrl.selectedCategoryId || this.expensesData.getCategory(ctrl.selectedCategoryId) === undefined) {
                this.previousCategoryId = ctrl.selectedCategoryId = this.expensesData.getCategories()[0].uuid;
            }
        };
        LightExpensesController.prototype.updatePeriod = function () {
            var periodName;
            switch (this.periodType) {
                case PeriodType.CurrentWeek:
                    periodName = "week";
                    break;
                case PeriodType.CurrentMonth:
                    periodName = "month";
                    break;
                case PeriodType.CurrentYear:
                    periodName = "year";
                    break;
            }
            if (this.periodType !== PeriodType.Specific) {
                this.periodFrom = moment().startOf(periodName);
                this.periodTo = moment().endOf(periodName);
            }
        };
        LightExpensesController.prototype.updateDisplayExpenses = function () {
            var _this = this;
            var displayExpenses = this.expensesData.getExpenses().filter(function (expense) { return moment(expense.date).isBetween(_this.periodFrom, _this.periodTo); });
            displayExpenses.sort(function (a, b) { return b.date.getTime() - a.date.getTime(); });
            this.possibleExpensesCount = displayExpenses.length;
            this.filteredExpenses = displayExpenses;
            this.displayExpenses = displayExpenses.slice(0, this.displayExpensesNumber);
            this.updateStatistics();
        };
        LightExpensesController.prototype.updateStatistics = function () {
            var result = {};
            var totalAmount = 0;
            this.filteredExpenses.forEach(function (expense) {
                if (result[expense.categoryId] === undefined) {
                    result[expense.categoryId] = new StatisticsItem(expense.categoryId, 0, 0);
                }
                result[expense.categoryId].amount += expense.amount;
                totalAmount += expense.amount;
            });
            var final = [];
            if (totalAmount > 0) {
                for (var categoryId in result) {
                    var stat = result[categoryId];
                    stat.percent = stat.amount / totalAmount * 100;
                    final.push(stat);
                }
            }
            final.sort(function (a, b) { return b.amount - a.amount; });
            this.statistics = final;
            this.totalAmount = totalAmount;
        };
        LightExpensesController.prototype.errorFor = function (expense) {
            return this.expensesSynchronizer.lastProblems[expense.uuid];
        };
        LightExpensesController.prototype.getCategory = function (uuid) {
            return this.expensesData.getCategory(uuid);
        };
        LightExpensesController.prototype.toggleEditExpense = function (expense) {
            if (this.editExpense && this.editExpense.uuid == expense.uuid) {
                this.editExpense = null;
            }
            else {
                this.editExpense = expense;
            }
        };
        LightExpensesController.prototype.increaseDisplayExpenses = function () {
            this.displayExpensesNumber += 20;
            this.updateDisplayExpenses();
        };
        LightExpensesController.prototype.resetDisplayExpenses = function () {
            this.displayExpensesNumber = 3;
            this.updateDisplayExpenses();
        };
        return LightExpensesController;
    })();
    exports.LightExpenses = angular.module("LightExpenses", []);
    exports.LightExpenses.controller("LightExpensesController", LightExpensesController);
    exports.LightExpenses.service("expensesStorage", services.ExpensesStorageService);
    exports.LightExpenses.service("expensesData", services.ExpenseDataService);
    exports.LightExpenses.service("expensesSynchronizer", services.ExpensesSynchronizer);
    exports.LightExpenses.value("angularData", {});
    categoryList.register(exports.LightExpenses);
    expenseEditor.register(exports.LightExpenses);
    exports.LightExpenses.directive('focusMe', function ($timeout) {
        return {
            scope: { trigger: '=focusMe' },
            link: function (scope, element) {
                scope.$watch('trigger', function (value) {
                    if (value === true) {
                        $timeout(function () {
                            element[0].focus();
                            scope.trigger = false;
                        });
                    }
                });
            }
        };
    });
});
//# sourceMappingURL=lightexpenses.js.map