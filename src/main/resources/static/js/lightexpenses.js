/// <reference path="../typings/angularjs/angular.d.ts" />
// amd-dependency path="/bower-libs/moment/moment.js" />
define(["require", "exports", 'bower-libs/moment/moment'], function (require, exports, moment) {
    var Expense = (function () {
        function Expense(categoryId, amount, description, date, saved, id) {
            if (date === void 0) { date = new Date(); }
            if (saved === void 0) { saved = false; }
            if (id === void 0) { id = generateUUID(); }
            this.categoryId = categoryId;
            this.amount = amount;
            this.description = description;
            this.date = date;
            this.saved = saved;
            this.id = id;
        }
        return Expense;
    })();
    var ExpenseCategory = (function () {
        function ExpenseCategory(name, saved, id) {
            if (saved === void 0) { saved = false; }
            if (id === void 0) { id = generateUUID(); }
            this.name = name;
            this.saved = saved;
            this.id = id;
        }
        return ExpenseCategory;
    })();
    var ExpensesStorage = (function () {
        function ExpensesStorage($window) {
            this.$window = $window;
        }
        ExpensesStorage.prototype.saveExpenses = function (expenses) {
            var result = expenses.map(function (expense) {
                var e = angular.copy(expense);
                e.date = expense.date.getTime();
                return e;
            });
            this.$window.localStorage.setItem("expenses", angular.toJson(result));
        };
        ExpensesStorage.prototype.loadExpenses = function () {
            var item = this.$window.localStorage.getItem("expenses");
            if (item === null) {
                return null;
            }
            else {
                var data = angular.fromJson(item);
                return data.map(function (e) {
                    return new Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.saved, e.id);
                });
            }
        };
        ExpensesStorage.prototype.saveCategories = function (categories) {
            this.$window.localStorage.setItem("categories", angular.toJson(categories));
        };
        ExpensesStorage.prototype.loadCategories = function () {
            var item = this.$window.localStorage.getItem("categories");
            if (item === null) {
                return null;
            }
            else {
                var data = angular.fromJson(item);
                return data.map(function (c) { return new ExpenseCategory(c.name, c.saved, c.id); });
            }
        };
        ExpensesStorage.prototype.saveLastSelectedCategory = function (categoryId) {
            this.$window.localStorage.setItem("lastCategoryId", categoryId);
        };
        ExpensesStorage.prototype.loadLastSelectedCategory = function () {
            return this.$window.localStorage.getItem("lastCategoryId");
        };
        return ExpensesStorage;
    })();
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
    var LightExpensesController = (function () {
        function LightExpensesController($scope, $timeout, expensesStorage) {
            var _this = this;
            this.$scope = $scope;
            this.$timeout = $timeout;
            this.expensesStorage = expensesStorage;
            this.focusAmount = true;
            this.displayExpensesNumber = 3;
            this.periodType = PeriodType.CurrentMonth;
            $scope.c = this;
            console.log(expensesStorage);
            this.categories = expensesStorage.loadCategories();
            if (!this.categories) {
                this.categories = [
                    new ExpenseCategory("Еда"),
                    new ExpenseCategory("Одежда"),
                    new ExpenseCategory("Транспорт"),
                    new ExpenseCategory("Машина"),
                    new ExpenseCategory("Спорт"),
                    new ExpenseCategory("Лечение")
                ];
                expensesStorage.saveCategories(this.categories);
            }
            this.categories.sort(function (a, b) { return a.name.localeCompare(b.name); });
            this.updateCategoriesById();
            this.selectedCategoryId = expensesStorage.loadLastSelectedCategory();
            if (!this.selectedCategoryId || this.categoriesById[this.selectedCategoryId] === undefined) {
                this.selectedCategoryId = this.categories[0].id;
            }
            this.expenses = expensesStorage.loadExpenses();
            if (!this.expenses) {
                this.expenses = [];
            }
            this.updatePeriod();
            this.updateDisplayExpenses();
            $scope.$watch(function () { return _this.selectedCategoryId; }, function () {
                expensesStorage.saveLastSelectedCategory(_this.selectedCategoryId);
            });
        }
        LightExpensesController.prototype.addExpense = function () {
            var _this = this;
            if (this.currentAmount < 0 || !this.currentAmount) {
                // Валидации у нас мало, так что можно так
                return;
            }
            this.expenses.push(new Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription));
            this.$timeout(function () {
                _this.currentAmount = null;
                _this.currentDescription = null;
                _this.focusAmount = true;
            }, 50);
            this.updateDisplayExpenses();
            this.expensesStorage.saveExpenses(this.expenses);
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
            var displayExpenses = this.expenses.filter(function (expense) { return moment(expense.date).isBetween(_this.periodFrom, _this.periodTo); });
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
            this.categories.forEach(function (c) { return _this.categoriesById[c.id] = c; });
        };
        return LightExpensesController;
    })();
    exports.LightExpensesController = LightExpensesController;
    function generateUUID() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    exports.LightExpenses = angular.module("LightExpenses", []);
    exports.LightExpenses.controller("LightExpensesController", LightExpensesController);
    exports.LightExpenses.service("expensesStorage", ExpensesStorage);
    exports.LightExpenses.directive('focusMe', function ($timeout) {
        return {
            scope: { trigger: '=focusMe' },
            link: function (scope, element) {
                scope.$watch('trigger', function (value) {
                    console.log('!!!: ', value);
                    if (value === true) {
                        $timeout(function () {
                            console.log('!!!11');
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