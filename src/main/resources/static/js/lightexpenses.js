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
        function ExpenseCategory(name, parentCategoryId, saved, id) {
            if (parentCategoryId === void 0) { parentCategoryId = null; }
            if (saved === void 0) { saved = false; }
            if (id === void 0) { id = generateUUID(); }
            this.name = name;
            this.parentCategoryId = parentCategoryId;
            this.saved = saved;
            this.id = id;
        }
        return ExpenseCategory;
    })();
    /**
     * Main role is to maintain current expense data & manage change events.
     *
     * There is no strict mutability handling. So if one changes Expense he has to call updateExpense() which effectively triggers update.
     */
    var ExpenseDataService = (function () {
        function ExpenseDataService(expensesStorage, $timeout) {
            this.expensesStorage = expensesStorage;
            this.$timeout = $timeout;
            this.updateExpensesListeners = [];
            this.updateCategoriesListeners = [];
            this._categories = expensesStorage.loadCategories();
            if (!this._categories) {
                this._categories = [
                    new ExpenseCategory("Еда"),
                    new ExpenseCategory("Одежда"),
                    new ExpenseCategory("Транспорт"),
                    new ExpenseCategory("Машина"),
                    new ExpenseCategory("Спорт"),
                    new ExpenseCategory("Лечение")
                ];
                expensesStorage.saveCategories(this._categories);
            }
            this._categories.sort(function (a, b) { return a.name.localeCompare(b.name); });
            this._expenses = expensesStorage.loadExpenses();
            if (!this._expenses) {
                this._expenses = [];
            }
            this.notifyExpenseChanged();
            this.notifyCategoryChanged();
        }
        Object.defineProperty(ExpenseDataService.prototype, "expenses", {
            get: function () {
                return this._expenses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExpenseDataService.prototype, "categories", {
            get: function () {
                return this._categories;
            },
            enumerable: true,
            configurable: true
        });
        ExpenseDataService.prototype.onUpdateExpenses = function (fun, notify) {
            if (notify === void 0) { notify = true; }
            this.updateExpensesListeners.push(fun);
            if (notify)
                fun();
        };
        ExpenseDataService.prototype.onUpdateCategories = function (fun, notify) {
            if (notify === void 0) { notify = true; }
            this.updateCategoriesListeners.push(fun);
            if (notify)
                fun();
        };
        ExpenseDataService.prototype.notifyExpenseChanged = function () {
            this.updateExpensesListeners.forEach(function (it) { return it(); });
            // Looks like we have to call it ourselves to break cycle dependency
            this.expensesStorage.saveExpenses(this.expenses);
        };
        ExpenseDataService.prototype.notifyCategoryChanged = function () {
            this.updateCategoriesListeners.forEach(function (it) { return it(); });
            // Looks like we have to call it ourselves to break cycle dependency
            this.expensesStorage.saveCategories(this.categories);
        };
        ExpenseDataService.prototype.addExpense = function (expense) {
            this.expenses.push(expense);
            this.notifyExpenseChanged();
        };
        ExpenseDataService.prototype.addCategory = function (category) {
            this.categories.push(category);
            this.notifyCategoryChanged();
        };
        return ExpenseDataService;
    })();
    /**
     * Main role is to save/restore LocalStorage copy
     */
    var ExpensesStorageService = (function () {
        function ExpensesStorageService($window, $log) {
            this.$window = $window;
            this.$log = $log;
        }
        ExpensesStorageService.prototype.saveExpenses = function (expenses) {
            var result = expenses.map(function (expense) {
                var e = angular.copy(expense);
                e.date = expense.date.getTime();
                return e;
            });
            this.$window.localStorage.setItem("expenses", angular.toJson(result));
        };
        ExpensesStorageService.prototype.loadExpenses = function () {
            var item = this.$window.localStorage.getItem("expenses");
            if (item === null) {
                return null;
            }
            else {
                try {
                    var data = angular.fromJson(item);
                    return data.map(function (e) {
                        return new Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.saved, e.id);
                    });
                }
                catch (e) {
                    this.$log.error("Error while loading expenses", e);
                    return null;
                }
            }
        };
        ExpensesStorageService.prototype.saveCategories = function (categories) {
            this.$window.localStorage.setItem("categories", angular.toJson(categories));
        };
        ExpensesStorageService.prototype.loadCategories = function () {
            var item = this.$window.localStorage.getItem("categories");
            if (item === null) {
                return null;
            }
            else {
                try {
                    var data = angular.fromJson(item);
                    return data.map(function (c) { return new ExpenseCategory(c.name, c.parentCategoryId, c.saved, c.id); });
                }
                catch (e) {
                    this.$log.error("Error while loading categories", e);
                    return null;
                }
            }
        };
        ExpensesStorageService.prototype.saveLastSelectedCategory = function (categoryId) {
            this.$window.localStorage.setItem("lastCategoryId", categoryId);
        };
        ExpensesStorageService.prototype.loadLastSelectedCategory = function () {
            return this.$window.localStorage.getItem("lastCategoryId");
        };
        return ExpensesStorageService;
    })();
    var ExpensesSynchronizer = (function () {
        function ExpensesSynchronizer($http) {
            this.$http = $http;
        }
        return ExpensesSynchronizer;
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
    var LightExpensesControllerDisplay = (function () {
        function LightExpensesControllerDisplay() {
            this.whyLogin = false;
        }
        return LightExpensesControllerDisplay;
    })();
    var LightExpensesController = (function () {
        function LightExpensesController($scope, $timeout, expensesStorage, expensesData, angularData) {
            var _this = this;
            this.$scope = $scope;
            this.$timeout = $timeout;
            this.expensesStorage = expensesStorage;
            this.expensesData = expensesData;
            this.angularData = angularData;
            this.focusAmount = true;
            this.displayExpensesNumber = 3;
            this.periodType = PeriodType.CurrentMonth;
            $scope.c = this;
            this.updatePeriod();
            expensesData.onUpdateCategories(function () { return _this.updateCategoriesById(); });
            expensesData.onUpdateExpenses(function () { return _this.updateDisplayExpenses(); });
            this.selectedCategoryId = expensesStorage.loadLastSelectedCategory();
            // NOTE: Expects listener to be called
            if (!this.selectedCategoryId || this.categoriesById[this.selectedCategoryId] === undefined) {
                this.selectedCategoryId = this.expensesData.categories[0].id;
            }
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
            this.expensesData.addExpense(new Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription));
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
            var displayExpenses = this.expensesData.expenses.filter(function (expense) { return moment(expense.date).isBetween(_this.periodFrom, _this.periodTo); });
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
            this.expensesData.categories.forEach(function (c) { return _this.categoriesById[c.id] = c; });
            this.displayCategories = this.expensesData.categories;
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
    exports.LightExpenses.service("expensesStorage", ExpensesStorageService);
    exports.LightExpenses.service("expensesData", ExpenseDataService);
    exports.LightExpenses.value("angularData", {});
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