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
    constructor(public name: string, public saved: Boolean = false, public id: string = generateUUID()) {
    }
}

class ExpensesStorage {
    constructor(private $window: angular.IWindowService) {
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
            var data = angular.fromJson(item);
            return data.map((e: Expense & {date: number}) =>
                new Expense(e.categoryId, e.amount, e.description, new Date(e.date), e.saved, e.id)
            )
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
            var data: Array<ExpenseCategory> = angular.fromJson(item);
            return data.map(c => new ExpenseCategory(c.name, c.saved, c.id))
        }
    }

    public saveLastSelectedCategory(categoryId: string) {
        this.$window.localStorage.setItem("lastCategoryId", categoryId);
    }

    public loadLastSelectedCategory(): string {
        return this.$window.localStorage.getItem("lastCategoryId");
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

export class LightExpensesController {
    public expenses: Array<Expense>;
    public categories: Array<ExpenseCategory>;
    public categoriesById: { [categoryId: string]: ExpenseCategory; };

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

    constructor(private $scope: any, private $timeout: angular.ITimeoutService, private expensesStorage: ExpensesStorage) {
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

        this.categories.sort((a, b) => a.name.localeCompare(b.name));
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

        $scope.$watch(() => this.selectedCategoryId, () => {
            expensesStorage.saveLastSelectedCategory(this.selectedCategoryId);
        });
    }

    public addExpense() {
        if (this.currentAmount < 0 || !this.currentAmount) {
            // Валидации у нас мало, так что можно так
            return;
        }

        this.expenses.push(new Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription));
        this.$timeout(() => {
            this.currentAmount = null;
            this.currentDescription = null;
            this.focusAmount = true;
        }, 50);

        this.updateDisplayExpenses();
        this.expensesStorage.saveExpenses(this.expenses);
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
        var displayExpenses = this.expenses.filter(expense => moment(expense.date).isBetween(this.periodFrom, this.periodTo));
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
        this.categories.forEach(c => this.categoriesById[c.id] = c)
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
LightExpenses.service("expensesStorage", ExpensesStorage);

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