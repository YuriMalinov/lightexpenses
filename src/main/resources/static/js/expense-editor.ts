/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

// amd-dependency path="/bower-libs/moment/moment.js" />
import moment = require('bower-libs/moment/moment');
import IWindowService = angular.IWindowService;
import categoryList = require('js/category-list');
import services = require('js/services');
import model = require('js/model');
import {ExpenseCategory, Expense} from "./model";


/**
 * TODO, надо собственно перенести сюда причитающуюся сюда часть из основного контроллера. Пока что всё работает за счёт наследования Scope-ов
 */
class ExpenseEditorCtrl {
    constructor($scope) {
        $scope.e = this;
    }
}


export function register(module: angular.IModule) {
    module.directive('expenseEditor', () => {
        return {
            restriction: 'E',
            templateUrl: '/js/expense-editor.html',
            controller: ExpenseEditorCtrl
        }
    })
}