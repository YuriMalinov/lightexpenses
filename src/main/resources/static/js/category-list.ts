/// <reference path="../typings/angularjs/angular.d.ts" />
import services = require('js/services');
import model = require('js/model');
import {ExpenseCategory} from "./model";


interface CategoryListCtrlScope {
    onClose: (ExpenseCategory) => any;
    c: CategoryListCtrl;
}

class CategoryListCtrl {
    //noinspection JSMismatchedCollectionQueryUpdate
    private categories: Array<ExpenseCategory> = [];
    private editItem: ExpenseCategory;
    private newItem: ExpenseCategory;
    private lastCategory: ExpenseCategory;

    constructor(private $scope: CategoryListCtrlScope, private expensesData: services.ExpenseDataService, private $window: angular.IWindowService) {
        $scope.c = this;
        this.updateCategories();
    }

    private updateCategories() {
        this.categories = model.sortCategoriesByParent(this.expensesData.getCategories());
    };

    addCategory() {
        if (!this.newItem) {
            this.newItem = new ExpenseCategory('');
            this.editItem = null;
        } else {
            this.newItem = null;
        }
    }

    editCategory(cat: ExpenseCategory) {
        if (this.editItem !== cat) {
            this.editItem = cat;
            this.newItem = null;
        } else {
            this.editItem = null;
        }
    }

    cancelEdit = () => {
        this.newItem = null;
        this.editItem = null;
    };

    deleteCategory(cat: ExpenseCategory) {
        if (this.$window.confirm("Удалить категорию?")) {
            this.expensesData.deleteCategory(cat);
            this.updateCategories();
        }
    }

    saveCategory = (original: ExpenseCategory, newData: ExpenseCategory) => {
        original.changed = true;
        original.name = newData.name;
        original.parentCategoryId = newData.parentCategoryId;

        this.lastCategory = original;

        if (this.newItem === original) {
            this.expensesData.addCategory(this.newItem);
            this.newItem = null;
        } else {
            this.expensesData.updateCategory(this.editItem);
            this.editItem = null;
        }

        this.updateCategories();
    };

    close() {
        this.$scope.onClose(this.lastCategory);
        this.updateCategories();
    }
}

interface CategoryEditorScope {
    category: ExpenseCategory;
    onSave: (original: ExpenseCategory, changed: ExpenseCategory) => any;
    onCancel: (category: ExpenseCategory) => any;
    c: CategoryEditorCtrl;
}

class CategoryEditorCtrl {
    private edit: ExpenseCategory;
    private categories: ExpenseCategory[];

    constructor(private $scope: CategoryEditorScope, expensesData: services.ExpenseDataService) {
        $scope.c = this;

        this.edit = angular.copy($scope.category);
        var categories =  expensesData.getCategories().filter(cat => cat.parentCategoryId === null && cat.uuid != $scope.category.uuid);
        categories.sort((a, b) => a.name.localeCompare(b.name));
        var nullCategory = new ExpenseCategory('Не выбрана', null, false, null);
        this.categories = [nullCategory].concat(categories);
    }

    save() {
        this.$scope.onSave(this.$scope.category, this.edit);
    }

    cancel() {
        this.$scope.onCancel(this.$scope.category);
    }
}


export function register(module: angular.IModule) {
    module
        .directive('categoryList', () => {
            return {
                'restrict': 'E',
                'scope': {
                    onClose: '=onClose'
                },
                'templateUrl': '/js/category-list.html',
                'controller': CategoryListCtrl
            }
        })
        .directive('categoryEditor', () => {
            return {
                'restrict': 'E',
                'scope': {
                    category: '=category',
                    onSave: '=onSave',
                    onCancel: '=onCancel'
                },
                'templateUrl': '/js/category-editor.html',
                'controller': CategoryEditorCtrl
            }
        })
}
