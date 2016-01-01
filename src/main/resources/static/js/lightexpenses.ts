/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

// amd-dependency path="/bower-libs/moment/moment.js" />
import moment = require('bower-libs/moment/moment');
import IWindowService = angular.IWindowService;
import categoryList = require('js/category-list');
import services = require('js/services');
import model = require('js/model');
import {ExpenseCategory, Expense} from "./model";

class StatisticsItem {
    constructor(public categoryId: string, public amount: number, public percent: number) {
    }
}

enum PeriodType {CurrentWeek, CurrentMonth, CurrentYear, Specific}

class LightExpensesControllerDisplay {
    public whyLogin = false;
}

class LightExpensesController {
    public categoriesById: { [categoryId: string]: ExpenseCategory; };
    public displayCategories: Array<ExpenseCategory>;

    public selectedCategoryId: string;
    public previousCategoryId: string;
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
                private expensesStorage: services.ExpensesStorageService,
                private expensesData: services.ExpenseDataService,
                private angularData: model.AngularData,
                expensesSynchronizer: services.ExpensesSynchronizer) {
        $scope.c = this;

        this.updatePeriod();

        expensesData.onUpdateCategories(() => this.updateCategoriesById());
        expensesData.onUpdateExpenses(() => this.updateDisplayExpenses());

        this.selectedCategoryId = expensesStorage.loadLastSelectedCategory();
        // NOTE: Expects listener to be called
        if (!this.selectedCategoryId || this.categoriesById[this.selectedCategoryId] === undefined) {
            this.previousCategoryId = this.selectedCategoryId = this.expensesData.getCategories()[0].uuid;
        }

        $scope.$watch(() => this.selectedCategoryId, (newValue: string, oldValue: string) => {
            if (this.selectedCategoryId != 'setup') {
                expensesStorage.saveLastSelectedCategory(this.selectedCategoryId);
            }

            if (newValue != oldValue) {
                this.previousCategoryId = oldValue;
            }
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
        var displayExpenses = this.expensesData.getExpenses().filter(expense => moment(expense.date).isBetween(this.periodFrom, this.periodTo));
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

    finishSetup = (lastCategory: ExpenseCategory) => {
        this.selectedCategoryId = lastCategory ? lastCategory.uuid : this.previousCategoryId;
    };

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
        this.expensesData.getCategories().forEach(c => this.categoriesById[c.uuid] = c);
        var display = model.sortCategoriesByParent(this.expensesData.getCategories());

        this.displayCategories = display.concat([new ExpenseCategory('Настроить', null, true, 'setup')]);
    }

}


export var LightExpenses = angular.module("LightExpenses", []);
LightExpenses.controller("LightExpensesController", LightExpensesController);
LightExpenses.service("expensesStorage", services.ExpensesStorageService);
LightExpenses.service("expensesData", services.ExpenseDataService);
LightExpenses.service("expensesSynchronizer", services.ExpensesSynchronizer);
LightExpenses.value("angularData", {});

categoryList.register(LightExpenses);


LightExpenses.directive('focusMe', function ($timeout) {
    return {
        scope: {trigger: '=focusMe'},
        link: function (scope: any, element) {
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