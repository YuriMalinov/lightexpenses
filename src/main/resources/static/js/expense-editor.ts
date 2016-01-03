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


export class ExpenseEditorCtrl {
    public displayCategories: Array<ExpenseCategory>;

    public setDate = false;
    public selectedDate: Date;
    public selectedTime: Date;

    public selectedCategoryId: string;
    public currentAmount: number;
    public currentDescription: string;
    public focusAmount: boolean = true;

    public isAddition: boolean;

    constructor($scope: angular.IScope & any, private expensesData: services.ExpenseDataService, private $timeout: angular.ITimeoutService) {
        $scope.c = this;
        this.isAddition = $scope.isAddition;
        if ($scope.isAddition) {
            $scope.parent.setupAddExpense(this);
        }

        var categoryListener = () => this.updateDisplayCategories();
        expensesData.onUpdateCategories(categoryListener);
        $scope.$on('$destroy', () => expensesData.removeOnUpdateCategories(categoryListener));
    }

    toggleDate() {
        this.setDate = !this.setDate;
        this.selectedDate = new Date();
        this.selectedTime = new Date();
    }

    addExpense() {
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

        this.expensesData.addExpense(new Expense(this.selectedCategoryId, this.currentAmount, this.currentDescription, date));

        this.$timeout(() => {
            this.currentAmount = null;
            this.currentDescription = null;
            this.focusAmount = true;
        }, 50);
    }


    private updateDisplayCategories() {
        var display = model.sortCategoriesByParent(this.expensesData.getCategories());

        if (this.isAddition) {
            this.displayCategories = display.concat([new ExpenseCategory('Настроить', null, true, 'setup')]);
        }
        console.log('updated', this.displayCategories);
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
                isAddition: '=',
                parent: '='
            },
            link: (scope, element: JQuery) => {

            }
        }
    })
}