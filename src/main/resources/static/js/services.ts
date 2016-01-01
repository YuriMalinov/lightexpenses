/// <reference path="../typings/angularjs/angular.d.ts" />

import model = require('js/model');
import {Expense, ExpenseCategory} from "./model";

/**
 * Main role is to maintain current expense data & manage change events.
 *
 * There is no strict mutability handling. So if one changes Expense he has to call updateExpense() which effectively triggers update.
 */
export class ExpenseDataService {
    private _expenses: Array<Expense>;
    private _categories: Array<ExpenseCategory>;

    private updateExpensesListeners: Array<() => void> = [];
    private updateCategoriesListeners: Array<() => void> = [];

    constructor(private expensesStorage: ExpensesStorageService, private $timeout: angular.ITimeoutService) {
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

        this._categories.sort((a, b) => a.name.localeCompare(b.name));

        this._expenses = expensesStorage.loadExpenses();
        if (!this._expenses) {
            this._expenses = [];
        }

        this.notifyExpenseChanged();
        this.notifyCategoryChanged();
    }

    getExpenses(): Array<Expense> {
        return this._expenses;
    }

    getCategories(): Array<ExpenseCategory> {
        return this._categories.filter(cat => !cat.trash);
    }

    getAllCategories(): Array<ExpenseCategory> {
        return this._categories;
    }

    onUpdateExpenses(fun: () => void, notify: boolean = true) {
        this.updateExpensesListeners.push(fun);
        if (notify) fun();
    }

    onUpdateCategories(fun: () => void, notify: boolean = true) {
        this.updateCategoriesListeners.push(fun);
        if (notify) fun();
    }

    notifyExpenseChanged() {
        this.updateExpensesListeners.forEach(it => it());
        // Looks like we have to call it ourselves to break cycle dependency
        this.expensesStorage.saveExpenses(this._expenses);
    }

    notifyCategoryChanged() {
        this.updateCategoriesListeners.forEach(it => it());
        // Looks like we have to call it ourselves to break cycle dependency
        this.expensesStorage.saveCategories(this.getAllCategories());
    }

    addExpense(expense: Expense) {
        this._expenses.push(expense);
        this.notifyExpenseChanged();
    }

    addCategory(category: ExpenseCategory) {
        this._categories.push(category);
        this.notifyCategoryChanged();
    }

    /**
     * Находит элемент в коллекции и обновляет данные в нём. Даже, если это копия.
     * @param change
     */
    updateCategory(change: ExpenseCategory) {
        var found = false;
        this._categories.every(cat => {
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
        } else {
            this.notifyCategoryChanged();
        }
    }

    deleteCategory(category: ExpenseCategory) {
        this._categories.every((cat) => {
            if (cat.uuid == category.uuid) {
                cat.trash = true;
                cat.changed = true;
                return false;
            } else {
                return true;
            }
        });

        this.notifyCategoryChanged();
    }

    updateCategories(categories: Array<ExpenseCategory>) {
        this._categories = categories;
        this.notifyCategoryChanged();
    }
}

/**
 * Main role is to save/restore LocalStorage copy
 */
export class ExpensesStorageService {
    constructor(private $window: angular.IWindowService, private $log: angular.ILogService) {
    }

    public saveExpenses(expenses: Array<Expense>) {
        var result = expenses.map(expense => {
            var e: any = angular.copy(expense);
            e.date = expense.date.getTime();
            return e;
        });

        this.$window.localStorage.setItem("expenses", angular.toJson(result));
    }

    public loadExpenses(): Array<Expense> {
        var item = this.$window.localStorage.getItem("expenses");
        if (item === null) {
            return null;
        } else {
            try {
                var data = angular.fromJson(item);
                return data.map((e: Expense & {date: number}) =>
                    new model.Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.changed, e.uuid)
                );
            } catch (e) {
                this.$log.error("Error while loading expenses", e);
                return null;
            }
        }
    }

    public saveCategories(categories: Array<ExpenseCategory>) {
        this.$window.localStorage.setItem("categories", angular.toJson(categories));
    }

    public loadCategories(): Array<ExpenseCategory> {
        var item = this.$window.localStorage.getItem("categories");
        if (item === null) {
            return null;
        } else {
            try {
                var data: Array<ExpenseCategory> = angular.fromJson(item);
                return data.map(c => new model.ExpenseCategory(c.name, c.parentCategoryId, c.changed, c.uuid))
            } catch (e) {
                this.$log.error("Error while loading categories", e);
                return null;
            }
        }
    }

    public saveLastSelectedCategory(categoryId: string) {
        this.$window.localStorage.setItem("lastCategoryId", categoryId);
    }

    public loadLastSelectedCategory(): string {
        return this.$window.localStorage.getItem("lastCategoryId");
    }
}

export class ExpensesSynchronizer {
    private inUpdate: boolean = false;

    constructor(private $http: angular.IHttpService,
                private $timeout: angular.ITimeoutService,
                private expensesData: ExpenseDataService,
                private angularData: model.AngularData) {
        if (angularData.authorized) {
            expensesData.onUpdateCategories(() => this.updateCategories());
        }
    }

    updateCategories() {
        if (this.inUpdate) return;

        var changedCats = this.expensesData.getAllCategories().filter(it => it.changed);
        this.$http.post("/data/sync-categories", {categories: changedCats}).then((result) => {
            var data: Array<ExpenseCategory> = <Array<ExpenseCategory>> result.data;
            var mapped = data.map(c => new model.ExpenseCategory(c.name, c.parentCategoryId, false, c.uuid));
            this.skipUpdate(() => this.expensesData.updateCategories(mapped));
        }).finally(() => {
            this.$timeout(() => this.updateCategories(), 15000);
        });
    }

    private skipUpdate(fn: () => any) {
        this.inUpdate = true;
        try {
            fn();
            this.inUpdate = false;
        } catch (e) {
            this.inUpdate = false;
            throw e;
        }
    }
}