/// <reference path="../typings/angularjs/angular.d.ts" />
define(["require", "exports", 'js/model'], function (require, exports, model) {
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
            if (!this._categories || this._categories.length == 0) {
                this._categories = [
                    new model.ExpenseCategory("Еда"),
                    new model.ExpenseCategory("Одежда"),
                    new model.ExpenseCategory("Транспорт"),
                    new model.ExpenseCategory("Машина"),
                    new model.ExpenseCategory("Спорт"),
                    new model.ExpenseCategory("Лечение")
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
        ExpenseDataService.prototype.getExpenses = function () {
            return this._expenses;
        };
        ExpenseDataService.prototype.getCategories = function () {
            return this._categories.filter(function (cat) { return !cat.trash; });
        };
        ExpenseDataService.prototype.getAllCategories = function () {
            return this._categories;
        };
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
            this.expensesStorage.saveExpenses(this._expenses);
        };
        ExpenseDataService.prototype.notifyCategoryChanged = function () {
            this.updateCategoriesListeners.forEach(function (it) { return it(); });
            // Looks like we have to call it ourselves to break cycle dependency
            this.expensesStorage.saveCategories(this.getAllCategories());
        };
        ExpenseDataService.prototype.addExpense = function (expense) {
            this._expenses.push(expense);
            this.notifyExpenseChanged();
        };
        ExpenseDataService.prototype.addCategory = function (category) {
            this._categories.push(category);
            this.notifyCategoryChanged();
        };
        /**
         * Находит элемент в коллекции и обновляет данные в нём. Даже, если это копия.
         * @param change
         */
        ExpenseDataService.prototype.updateCategory = function (change) {
            var found = false;
            this._categories.every(function (cat) {
                if (cat.uuid == change.uuid) {
                    cat.changed = true;
                    cat.name = change.name;
                    cat.parentCategoryId = change.parentCategoryId;
                    found = true;
                    return false;
                }
                return true;
            });
            if (!found) {
                this.addCategory(change);
            }
            else {
                this.notifyCategoryChanged();
            }
        };
        ExpenseDataService.prototype.deleteCategory = function (category) {
            this._categories.every(function (cat) {
                if (cat.uuid == category.uuid) {
                    cat.trash = true;
                    cat.changed = true;
                    return false;
                }
                else {
                    return true;
                }
            });
            this.notifyCategoryChanged();
        };
        ExpenseDataService.prototype.updateCategories = function (categories) {
            this._categories = categories;
            this.notifyCategoryChanged();
        };
        return ExpenseDataService;
    })();
    exports.ExpenseDataService = ExpenseDataService;
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
                        return new model.Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.changed, e.uuid);
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
                    return data.map(function (c) { return new model.ExpenseCategory(c.name, c.parentCategoryId, c.changed, c.uuid); });
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
    exports.ExpensesStorageService = ExpensesStorageService;
    var ExpensesSynchronizer = (function () {
        function ExpensesSynchronizer($http, $timeout, expensesData, angularData) {
            var _this = this;
            this.$http = $http;
            this.$timeout = $timeout;
            this.expensesData = expensesData;
            this.angularData = angularData;
            this.inUpdate = false;
            if (angularData.authorized) {
                expensesData.onUpdateCategories(function () { return _this.updateCategories(); });
            }
        }
        ExpensesSynchronizer.prototype.updateCategories = function () {
            var _this = this;
            if (this.inUpdate)
                return;
            var changedCats = this.expensesData.getAllCategories().filter(function (it) { return it.changed; });
            this.$http.post("/data/sync-categories", { categories: changedCats }).then(function (result) {
                var data = result.data;
                var mapped = data.map(function (c) { return new model.ExpenseCategory(c.name, c.parentCategoryId, false, c.uuid); });
                _this.skipUpdate(function () { return _this.expensesData.updateCategories(mapped); });
            }).finally(function () {
                _this.$timeout(function () { return _this.updateCategories(); }, 15000);
            });
        };
        ExpensesSynchronizer.prototype.skipUpdate = function (fn) {
            this.inUpdate = true;
            try {
                fn();
                this.inUpdate = false;
            }
            catch (e) {
                this.inUpdate = false;
                throw e;
            }
        };
        return ExpensesSynchronizer;
    })();
    exports.ExpensesSynchronizer = ExpensesSynchronizer;
});
//# sourceMappingURL=services.js.map