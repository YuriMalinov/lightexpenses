/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
define(["require", "exports", 'bower-libs/moment/moment', 'js/category-list', 'js/services', 'js/model', 'js/expense-editor', "./model"], function (require, exports, moment, categoryList, services, model, expenseEditor, model_1) {
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
            this.focusAmount = true;
            this.displayExpensesNumber = 3;
            this.periodType = PeriodType.CurrentMonth;
            this.finishSetup = function (lastCategory) {
                _this.selectedCategoryId = lastCategory ? lastCategory.uuid : _this.previousCategoryId;
            };
            $scope.c = this;
            this.updatePeriod();
            expensesData.onUpdateCategories(function () { return _this.updateCategoriesById(); });
            expensesData.onUpdateExpenses(function () { return _this.updateDisplayExpenses(); });
            this.selectedCategoryId = expensesStorage.loadLastSelectedCategory();
            // NOTE: Expects listener to be called
            if (!this.selectedCategoryId || this.categoriesById[this.selectedCategoryId] === undefined) {
                this.previousCategoryId = this.selectedCategoryId = this.expensesData.getCategories()[0].uuid;
            }
            $scope.$watch(function () { return _this.selectedCategoryId; }, function (newValue, oldValue) {
                if (_this.selectedCategoryId != 'setup') {
                    expensesStorage.saveLastSelectedCategory(_this.selectedCategoryId);
                }
                if (newValue != oldValue) {
                    _this.previousCategoryId = oldValue;
                }
            });
        }
        LightExpensesController.prototype.addExpense = function () {
            var _this = this;
            if (this.currentAmount < 0 || !this.currentAmount) {
                // Валидации у нас мало, так что можно так
                return;
            }
            this.expensesData.addExpense(new model_1.Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription));
            this.$timeout(function () {
                _this.currentAmount = null;
                _this.currentDescription = null;
                _this.focusAmount = true;
            }, 50);
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
        LightExpensesController.prototype.increaseDisplayExpenses = function () {
            this.displayExpensesNumber += 20;
            this.updateDisplayExpenses();
        };
        LightExpensesController.prototype.resetDisplayExpenses = function () {
            this.displayExpensesNumber = 3;
            this.updateDisplayExpenses();
        };
        LightExpensesController.prototype.updateCategoriesById = function () {
            var _this = this;
            this.categoriesById = {};
            this.expensesData.getCategories().forEach(function (c) { return _this.categoriesById[c.uuid] = c; });
            var display = model.sortCategoriesByParent(this.expensesData.getCategories());
            this.displayCategories = display.concat([new model_1.ExpenseCategory('Настроить', null, true, 'setup')]);
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