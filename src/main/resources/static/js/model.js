define(["require", "exports", 'js/helpers'], function (require, exports, helpers) {
    var Expense = (function () {
        function Expense(categoryId, amount, description, date, changed, uuid) {
            if (date === void 0) { date = new Date(); }
            if (changed === void 0) { changed = true; }
            if (uuid === void 0) { uuid = helpers.generateUUID(); }
            this.categoryId = categoryId;
            this.amount = amount;
            this.description = description;
            this.date = date;
            this.changed = changed;
            this.uuid = uuid;
        }
        return Expense;
    })();
    exports.Expense = Expense;
    var ExpenseCategory = (function () {
        function ExpenseCategory(name, parentCategoryId, changed, uuid, trash) {
            if (parentCategoryId === void 0) { parentCategoryId = null; }
            if (changed === void 0) { changed = true; }
            if (uuid === void 0) { uuid = helpers.generateUUID(); }
            if (trash === void 0) { trash = false; }
            this.name = name;
            this.parentCategoryId = parentCategoryId;
            this.changed = changed;
            this.uuid = uuid;
            this.trash = trash;
        }
        ExpenseCategory.prototype.displayName = function () {
            return (this.parentCategoryId ? '• ' : '') + this.name;
        };
        return ExpenseCategory;
    })();
    exports.ExpenseCategory = ExpenseCategory;
    /**
     * ХЗ, куда это. Это в чистом виде статическая работа с моделью.
     *
     * @param categories
     */
    function sortCategoriesByParent(categories) {
        var byParent = {};
        categories.forEach(function (cat) {
            var parent = cat.parentCategoryId || '';
            if (byParent[parent] === undefined) {
                byParent[parent] = [];
            }
            byParent[parent].push(cat);
        });
        var root = byParent[''];
        if (root === undefined) {
            console.error("Nothing found for root category");
            return categories; // Safe bet to keep working
        }
        root.sort(function (a, b) { return a.name.localeCompare(b.name); });
        var result = [];
        root.forEach(function (cat) {
            result.push(cat);
            var children = byParent[cat.uuid];
            if (children !== undefined) {
                children.sort(function (a, b) { return a.name.localeCompare(b.name); });
                children.forEach(function (c) { return result.push(c); });
            }
        });
        return result;
    }
    exports.sortCategoriesByParent = sortCategoriesByParent;
});
//# sourceMappingURL=model.js.map