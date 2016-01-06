/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

// amd-dependency path="/bower-libs/moment/moment.js" />
import moment = require('bower-libs/moment/moment');
import datepicker = require('bower-libs/bootstrap-datepicker/dist/js/bootstrap-datepicker');
import IWindowService = angular.IWindowService;
import categoryList = require('js/category-list');
import services = require('js/services');
import model = require('js/model');
import {ExpenseCategory, Expense} from "./model";


class AddAlso {
    public expenseCategoryUuid: string;
    public amount: number;
    public description: string;
    public focus = false;
}

export class ExpenseEditorCtrl {
    public displayCategories: Array<ExpenseCategory>;

    public setDate = false;
    public selectedDate: Date;
    public selectedTime: Date;

    public selectedCategoryId: string;
    public currentAmount: number;
    public currentDescription: string;
    public focusAmount: boolean = true;

    public extraExpenses: AddAlso[] = [];

    public edit: Expense;

    constructor(private $scope: angular.IScope & any,
                private expensesData: services.ExpenseDataService,
                private $timeout: angular.ITimeoutService,
                private $window: angular.IWindowService) {
        $scope.c = this;
        if ($scope.edit) {
            this.edit = angular.copy($scope.edit);
            this.setDate = true;
            this.selectedDate = new Date(this.edit.date.getTime());
            this.selectedTime = new Date(this.edit.date.getTime());
            this.selectedTime.setSeconds(0);
            this.selectedTime.setMilliseconds(0);
            this.currentAmount = this.edit.amount;
            this.currentDescription = this.edit.description;
            this.selectedCategoryId = this.edit.categoryId;
        } else {
            $scope.parent.setupAddExpense(this);
        }

        var categoryListener = () => this.updateDisplayCategories();
        expensesData.onUpdateCategories(categoryListener);
        $scope.$on('$destroy', () => expensesData.removeOnUpdateCategories(categoryListener));
    }

    toggleDate() {
        this.setDate = !this.setDate;
        if (!this.edit) {
            this.selectedDate = new Date();
            this.selectedTime = new Date();
            this.selectedTime.setSeconds(0);
            this.selectedTime.setMilliseconds(0);
        }
    }

    save() {
        if (this.currentAmount < 0 || !this.currentAmount) {
            // Валидации у нас мало, так что можно так
            return;
        }

        var date: Date;
        if (this.setDate) {
            date = new Date(this.selectedDate.getTime());
            date.setHours(this.selectedTime.getHours());
            date.setMinutes(this.selectedTime.getMinutes());
            date.setSeconds(this.selectedTime.getSeconds());
            date.setMilliseconds(this.selectedTime.getMilliseconds());
        } else {
            date = new Date();
        }

        if (this.edit) {
            var e = this.edit;
            e.amount = this.currentAmount;
            e.categoryId = this.selectedCategoryId;
            e.description = this.currentDescription;
            e.date = date;
            this.expensesData.updateExpense(e);
        } else {
            var amount = this.currentAmount;
            var start = new Date().getTime();
            this.extraExpenses.forEach((extra, index) => {
                this.expensesData.addExpense(new Expense(extra.expenseCategoryUuid, extra.amount, extra.description, date, new Date(start + index)), false);
                amount -= extra.amount;
            });

            this.expensesData.addExpense(new Expense(this.selectedCategoryId, amount, this.currentDescription, date, new Date(start + this.extraExpenses.length)));
        }

        if (this.edit) {
            this.$scope.close();
        } else {
            this.$timeout(() => {
                this.currentAmount = null;
                this.currentDescription = null;
                this.focusAmount = true;
                this.extraExpenses = [];
            }, 50);
        }
    }

    deleteExpense() {
        if (this.$window.confirm("Удалить расход?")) {
            this.expensesData.deleteExpense(this.edit);
        }
    }

    addExtraExpense() {
        var extra = new AddAlso();
        extra.expenseCategoryUuid = this.selectedCategoryId;
        extra.focus = true;

        this.extraExpenses.push(extra);
    }

    removeExtraExpense(index: number) {
        this.extraExpenses.splice(index, 1);
    }


    private updateDisplayCategories() {
        var display = model.sortCategoriesByParent(this.expensesData.getCategories());

        if (!this.edit) {
            display = display.concat([new ExpenseCategory('Настроить', null, true, 'setup')]);
        }
        this.displayCategories = display;
    }

    getCategory(uuid: string): ExpenseCategory {
        return this.expensesData.getCategory(uuid);
    }
}


export function register(module: angular.IModule) {
    module.directive('expenseEditor', () => {
        return {
            restriction: 'E',
            templateUrl: '/js/expense-editor.html',
            controller: ExpenseEditorCtrl,
            scope: {
                parent: '=',
                edit: '=',
                close: '&'
            },
            link: (scope, element: JQuery) => {

            }
        }
    })
}