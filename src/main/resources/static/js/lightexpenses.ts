/// <reference path="../typings/angularjs/angular.d.ts" />
// amd-dependency path="/bower-libs/moment/moment.js" />

/// <reference path="../typings/moment/moment.d.ts" />
import moment = require('bower-libs/moment/moment');
import IWindowService = angular.IWindowService;

class Expense {
    constructor(public categoryId: string,
                public amount: number,
                public description: string,
                public date: Date = new Date(),
                public saved: Boolean = false,
                public id: string = generateUUID()) {
    }
}

class ExpenseCategory {
    constructor(public name: string, public parentCategoryId: number = null, public saved: Boolean = false, public id: string = generateUUID()) {
    }
}

/**
 * Main role is to maintain current expense data & manage change events.
 *
 * There is no strict mutability handling. So if one changes Expense he has to call updateExpense() which effectively triggers update.
 */
class ExpenseDataService {
    private _expenses: Array<Expense>;
    private _categories: Array<ExpenseCategory>;

    private updateExpensesListeners: Array<() => void> = [];
    private updateCategoriesListeners: Array<() => void> = [];

    constructor(private expensesStorage: ExpensesStorageService, private $timeout: angular.ITimeoutService) {
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

        this._categories.sort((a, b) => a.name.localeCompare(b.name));

        this._expenses = expensesStorage.loadExpenses();
        if (!this._expenses) {
            this._expenses = [];
        }

        this.notifyExpenseChanged();
        this.notifyCategoryChanged();
    }

    get expenses(): Array<Expense> {
        return this._expenses;
    }

    get categories(): Array<ExpenseCategory> {
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
        this.expensesStorage.saveExpenses(this.expenses);
    }

    notifyCategoryChanged() {
        this.updateCategoriesListeners.forEach(it => it());
        // Looks like we have to call it ourselves to break cycle dependency
        this.expensesStorage.saveCategories(this.categories);
    }

    addExpense(expense: Expense) {
        this.expenses.push(expense);
        this.notifyExpenseChanged();
    }

    addCategory(category: ExpenseCategory) {
        this.categories.push(category);
        this.notifyCategoryChanged();
    }
}

/**
 * Main role is to save/restore LocalStorage copy
 */
class ExpensesStorageService {
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
                    new Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.saved, e.id)
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
                return data.map(c => new ExpenseCategory(c.name, c.parentCategoryId, c.saved, c.id))
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

class ExpensesSynchronizer {
    constructor(private $http: angular.IHttpService) {
    }
}

class StatisticsItem {
    constructor(public categoryId: string, public amount: number, public percent: number) {
    }
}

enum PeriodType {CurrentWeek, CurrentMonth, CurrentYear, Specific}

class LightExpensesControllerDisplay {
    public whyLogin = false;
}

interface AngularData {
    authorized: boolean
}

export class LightExpensesController {
    public categoriesById: { [categoryId: string]: ExpenseCategory; };
    public displayCategories: Array<ExpenseCategory>;

    public selectedCategoryId: string;
    public currentAmount: number;
    public currentDescription: string;
    public focusAmount: boolean = true;

    public displayExpenses: Array<Expense>;
    public filteredExpenses: Array<Expense>;
    public displayExpensesNumber: number = 3;
    public possibleExpensesCount: number;

    public periodType: PeriodType = PeriodType.CurrentMonth;
    public periodFrom: moment.Moment;
    public periodTo: moment.Moment;

    public statistics: Array<StatisticsItem>;
    public totalAmount: number;

    public display: LightExpensesControllerDisplay;

    constructor(private $scope: any,
                private $timeout: angular.ITimeoutService,
                private expensesStorage: ExpensesStorageService,
                private expensesData: ExpenseDataService,
                private angularData: AngularData) {
        $scope.c = this;

        this.updatePeriod();

        expensesData.onUpdateCategories(() => this.updateCategoriesById());
        expensesData.onUpdateExpenses(() => this.updateDisplayExpenses());

        this.selectedCategoryId = expensesStorage.loadLastSelectedCategory();
        // NOTE: Expects listener to be called
        if (!this.selectedCategoryId || this.categoriesById[this.selectedCategoryId] === undefined) {
            this.selectedCategoryId = this.expensesData.categories[0].id;
        }

        $scope.$watch(() => this.selectedCategoryId, () => {
            expensesStorage.saveLastSelectedCategory(this.selectedCategoryId);
        });
    }

    public addExpense() {
        if (this.currentAmount < 0 || !this.currentAmount) {
            // Валидации у нас мало, так что можно так
            return;
        }

        this.expensesData.addExpense(new Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription));

        this.$timeout(() => {
            this.currentAmount = null;
            this.currentDescription = null;
            this.focusAmount = true;
        }, 50);
    }

    public updatePeriod() {
        var periodName: string;
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
    }

    public updateDisplayExpenses() {
        var displayExpenses = this.expensesData.expenses.filter(expense => moment(expense.date).isBetween(this.periodFrom, this.periodTo));
        displayExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());

        this.possibleExpensesCount = displayExpenses.length;
        this.filteredExpenses = displayExpenses;
        this.displayExpenses = displayExpenses.slice(0, this.displayExpensesNumber);

        this.updateStatistics();
    }

    public updateStatistics() {
        var result: {[categoryId: number]: StatisticsItem} = {};
        var totalAmount = 0;
        this.filteredExpenses.forEach(expense => {
            if (result[expense.categoryId] === undefined) {
                result[expense.categoryId] = new StatisticsItem(expense.categoryId, 0, 0);
            }
            result[expense.categoryId].amount += expense.amount;
            totalAmount += expense.amount;
        });

        var final: Array<StatisticsItem> = [];
        if (totalAmount > 0) {
            for (var categoryId in result) {
                var stat = result[categoryId];
                stat.percent = stat.amount / totalAmount * 100;
                final.push(stat);
            }
        }

        final.sort((a, b) => b.amount - a.amount);

        this.statistics = final;
        this.totalAmount = totalAmount;
    }

    public increaseDisplayExpenses() {
        this.displayExpensesNumber += 20;
        this.updateDisplayExpenses();
    }

    public resetDisplayExpenses() {
        this.displayExpensesNumber = 3;
        this.updateDisplayExpenses();
    }

    private updateCategoriesById() {
        this.categoriesById = {};
        this.expensesData.categories.forEach(c => this.categoriesById[c.id] = c);
        this.displayCategories = this.expensesData.categories;
    }

}


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


export var LightExpenses = angular.module("LightExpenses", []);
LightExpenses.controller("LightExpensesController", LightExpensesController);
LightExpenses.service("expensesStorage", ExpensesStorageService);
LightExpenses.service("expensesData", ExpenseDataService);
LightExpenses.value("angularData", {});


LightExpenses.directive('focusMe', function ($timeout) {
    return {
        scope: {trigger: '=focusMe'},
        link: function (scope: any, element) {
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