/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

// amd-dependency path="/bower-libs/moment/moment.js" />
import moment = require('bower-libs/moment/moment');
import IWindowService = angular.IWindowService;
import categoryList = require('js/category-list');
import services = require('js/services');
import model = require('js/model');
import expenseEditor = require('js/expense-editor');
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
    public previousCategoryId: string;

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

    private addExpenseCtrl: expenseEditor.ExpenseEditorCtrl;

    constructor(private $scope: any,
                private $timeout: angular.ITimeoutService,
                private expensesStorage: services.ExpensesStorageService,
                private expensesData: services.ExpenseDataService,
                private angularData: model.AngularData,
                private expensesSynchronizer: services.ExpensesSynchronizer) {
        $scope.c = this;

        this.updatePeriod();

        expensesData.onUpdateExpenses(() => this.updateDisplayExpenses());

        // manage selected cat and previous is done by main ctrl because we EditorCtlrs are less responsible...
        $scope.$watch(() => this.addExpenseCtrl ? this.addExpenseCtrl.selectedCategoryId : null, (newValue: string, oldValue: string) => {
            if (this.addExpenseCtrl && this.addExpenseCtrl.selectedCategoryId != 'setup') {
                expensesStorage.saveLastSelectedCategory(this.addExpenseCtrl.selectedCategoryId);
            }

            if (newValue != oldValue) {
                this.previousCategoryId = oldValue;
            }
        });
    }

    public setupAddExpense(ctrl: expenseEditor.ExpenseEditorCtrl) {
        ctrl.selectedCategoryId = this.expensesStorage.loadLastSelectedCategory();
        // NOTE: Expects listener to be called
        if (!ctrl.selectedCategoryId || this.expensesData.getCategory(ctrl.selectedCategoryId) === undefined) {
            this.previousCategoryId = ctrl.selectedCategoryId = this.expensesData.getCategories()[0].uuid;
        }
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

    public errorFor(expense: Expense): string {
        return this.expensesSynchronizer.lastProblems[expense.uuid];
    }

    finishSetup = (lastCategory: ExpenseCategory) => {
        if (this.addExpenseCtrl) {
            this.addExpenseCtrl.selectedCategoryId = lastCategory ? lastCategory.uuid : this.previousCategoryId;
        }
    };

    public getCategory(uuid: string): ExpenseCategory {
        return this.expensesData.getCategory(uuid);
    }

    public increaseDisplayExpenses() {
        this.displayExpensesNumber += 20;
        this.updateDisplayExpenses();
    }

    public resetDisplayExpenses() {
        this.displayExpensesNumber = 3;
        this.updateDisplayExpenses();
    }
}


export var LightExpenses = angular.module("LightExpenses", []);
LightExpenses.controller("LightExpensesController", LightExpensesController);
LightExpenses.service("expensesStorage", services.ExpensesStorageService);
LightExpenses.service("expensesData", services.ExpenseDataService);
LightExpenses.service("expensesSynchronizer", services.ExpensesSynchronizer);
LightExpenses.value("angularData", {});

categoryList.register(LightExpenses);
expenseEditor.register(LightExpenses);


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