define(["require", "exports", 'js/model', "./model"], function (require, exports, model, model_1) {
    var CategoryListCtrl = (function () {
        function CategoryListCtrl($scope, expensesData, $window) {
            var _this = this;
            this.$scope = $scope;
            this.expensesData = expensesData;
            this.$window = $window;
            //noinspection JSMismatchedCollectionQueryUpdate
            this.categories = [];
            this.cancelEdit = function () {
                _this.newItem = null;
                _this.editItem = null;
            };
            this.saveCategory = function (original, newData) {
                original.changed = true;
                original.name = newData.name;
                original.parentCategoryId = newData.parentCategoryId;
                _this.lastCategory = original;
                if (_this.newItem === original) {
                    _this.expensesData.addCategory(_this.newItem);
                    _this.newItem = null;
                }
                else {
                    _this.expensesData.updateCategory(_this.editItem);
                    _this.editItem = null;
                }
                _this.updateCategories();
            };
            $scope.c = this;
            this.updateCategories();
        }
        CategoryListCtrl.prototype.updateCategories = function () {
            this.categories = model.sortCategoriesByParent(this.expensesData.getCategories());
        };
        ;
        CategoryListCtrl.prototype.addCategory = function () {
            if (!this.newItem) {
                this.newItem = new model_1.ExpenseCategory('');
                this.editItem = null;
            }
            else {
                this.newItem = null;
            }
        };
        CategoryListCtrl.prototype.editCategory = function (cat) {
            if (this.editItem !== cat) {
                this.editItem = cat;
                this.newItem = null;
            }
            else {
                this.editItem = null;
            }
        };
        CategoryListCtrl.prototype.deleteCategory = function (cat) {
            if (this.$window.confirm("Удалить категорию?")) {
                this.expensesData.deleteCategory(cat);
                this.updateCategories();
            }
        };
        CategoryListCtrl.prototype.close = function () {
            this.$scope.onClose(this.lastCategory);
            this.updateCategories();
        };
        return CategoryListCtrl;
    })();
    var CategoryEditorCtrl = (function () {
        function CategoryEditorCtrl($scope, expensesData) {
            this.$scope = $scope;
            $scope.c = this;
            this.edit = angular.copy($scope.category);
            var categories = expensesData.getCategories().filter(function (cat) { return cat.parentCategoryId === null && cat.uuid != $scope.category.uuid; });
            categories.sort(function (a, b) { return a.name.localeCompare(b.name); });
            var nullCategory = new model_1.ExpenseCategory('Не выбрана', null, false, null);
            this.categories = [nullCategory].concat(categories);
        }
        CategoryEditorCtrl.prototype.save = function () {
            this.$scope.onSave(this.$scope.category, this.edit);
        };
        CategoryEditorCtrl.prototype.cancel = function () {
            this.$scope.onCancel(this.$scope.category);
        };
        return CategoryEditorCtrl;
    })();
    function register(module) {
        module
            .directive('categoryList', function () {
            return {
                'restrict': 'E',
                'scope': {
                    onClose: '=onClose'
                },
                'templateUrl': '/js/category-list.html',
                'controller': CategoryListCtrl
            };
        })
            .directive('categoryEditor', function () {
            return {
                'restrict': 'E',
                'scope': {
                    category: '=category',
                    onSave: '=onSave',
                    onCancel: '=onCancel'
                },
                'templateUrl': '/js/category-editor.html',
                'controller': CategoryEditorCtrl
            };
        });
    }
    exports.register = register;
});
//# sourceMappingURL=category-list.js.map