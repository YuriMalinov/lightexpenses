/// <reference path="../typings/angularjs/angular.d.ts" />
define(["require", "exports", 'bower-libs/moment/moment', 'js/model'], function (require, exports, moment, model) {
    /**
     * Main role is to maintain current expense data & manage change events.
     *
     * There is no strict mutability handling. So if one changes Expense he has to call updateExpense() which effectively triggers update.
     */
    var ExpenseDataService = (function () {
        function ExpenseDataService(expensesStorage, $log) {
            var _this = this;
            this.expensesStorage = expensesStorage;
            this.$log = $log;
            this.updateExpensesListeners = [];
            this.updateCategoriesListeners = [];
            this.categoryById = {};
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
            this.onUpdateCategories(function () { return _this.updateSortedCategories(); });
        }
        ExpenseDataService.prototype.getExpenses = function () {
            return this._expenses.filter(function (e) { return !e.trash; });
        };
        ExpenseDataService.prototype.getAllExpenses = function () {
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
        ExpenseDataService.prototype.removeOnUpdateCategories = function (fun) {
            var _this = this;
            this.updateCategoriesListeners.every(function (f, i) {
                if (f === fun) {
                    _this.updateCategoriesListeners.splice(i, 1);
                    return false;
                }
                return true;
            });
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
        ExpenseDataService.prototype.updateExpense = function (expense) {
            var notFound = this._expenses.every(function (exp) {
                if (exp.uuid == expense.uuid) {
                    angular.extend(exp, expense);
                    exp.changed = true;
                    return false;
                }
                return true;
            });
            this.notifyExpenseChanged();
            if (notFound) {
                this.$log.warn("Nothing found to update for expense", expense);
            }
        };
        ExpenseDataService.prototype.deleteExpense = function (expense) {
            var notFound = this._expenses.every(function (exp) {
                if (exp.uuid == expense.uuid) {
                    exp.trash = exp.changed = true;
                    return false;
                }
                return true;
            });
            this.notifyExpenseChanged();
            if (notFound) {
                this.$log.warn("Nothing found to delete for expense", expense);
            }
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
                this.$log.warn("Nothing found to update for category", change, "addition is issued");
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
        ExpenseDataService.prototype.updateSortedCategories = function () {
            var _this = this;
            this.sortedCategories = model.sortCategoriesByParent(this.getCategories());
            this.categoryById = {};
            this.getCategories().forEach(function (cat) { return _this.categoryById[cat.uuid] = cat; });
        };
        ExpenseDataService.prototype.getSortedCategories = function () {
            return this.sortedCategories;
        };
        ExpenseDataService.prototype.getCategory = function (uuid) {
            return this.categoryById[uuid];
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
                e.createdDate = expense.createdDate.getTime();
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
                        return new model.Expense(e.categoryId, e.amount, e.description, new Date(e.date), new Date(e.createdDate), e.changed, e.uuid, e.trash);
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
                    return data.map(function (c) { return new model.ExpenseCategory(c.name, c.parentCategoryId, c.changed, c.uuid, c.trash); });
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
        function ExpensesSynchronizer($http, $timeout, $log, expensesData, angularData) {
            var _this = this;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$log = $log;
            this.expensesData = expensesData;
            this.angularData = angularData;
            this.inUpdate = false;
            this.lastProblems = {};
            if (angularData.authorized) {
                expensesData.onUpdateCategories(function () { return _this.updateCategories(); });
                expensesData.onUpdateExpenses(function () { return _this.updateExpenses(); });
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
        ExpensesSynchronizer.prototype.updateExpenses = function () {
            var _this = this;
            if (this.inUpdate)
                return;
            var originalByUuid = {};
            var changed = this.expensesData.getAllExpenses().filter(function (e) { return e.changed; }).map(function (e) {
                var send = angular.copy(e);
                send.date = moment(e.date).format();
                originalByUuid[e.uuid] = e;
                return send;
            });
            if (changed.length == 0)
                return;
            this.$http.post("/data/update-expenses", { expenses: changed }).then(function (result) {
                var data = result.data;
                if (data.problems.length) {
                    _this.$log.error("There were problems while saving expenses:", data.problems);
                }
                _this.lastProblems = {};
                data.problems.forEach(function (p) { return _this.lastProblems[p.expense.uuid] = p.problem; });
                changed.forEach(function (e) {
                    if (!_this.lastProblems[e.uuid]) {
                        originalByUuid[e.uuid].changed = false;
                    }
                });
                _this.skipUpdate(function () { return _this.expensesData.notifyExpenseChanged(); });
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