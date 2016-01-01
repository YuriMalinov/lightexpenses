import helpers = require('js/helpers');

export class Expense {
    constructor(public categoryId: string,
                public amount: number,
                public description: string,
                public date: Date = new Date(),
                public changed: boolean = true,
                public uuid: string = helpers.generateUUID()) {
    }
}

export class ExpenseCategory {
    constructor(public name: string,
                public parentCategoryId: string = null,
                public changed: boolean = true,
                public uuid: string = helpers.generateUUID(),
                public trash: boolean = false) {
    }

    displayName(): string {
        return (this.parentCategoryId ? '• ' : '') + this.name;
    }
}

/**
 * Вообще не совсем ему тут место... ну посмотрим со временем, куда деть.
 */
export interface AngularData {
    authorized: boolean
}

/**
 * ХЗ, куда это. Это в чистом виде статическая работа с моделью.
 *
 * @param categories
 */
export function sortCategoriesByParent(categories: ExpenseCategory[]): ExpenseCategory[] {
    var byParent: {(key: string): ExpenseCategory[]} = <any>{};
    categories.forEach(cat => {
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

    root.sort((a, b) => a.name.localeCompare(b.name));

    var result: ExpenseCategory[] = [];

    root.forEach((cat: ExpenseCategory) => {
        result.push(cat);
        var children = byParent[cat.uuid];
        if (children !== undefined) {
            children.sort((a, b) => a.name.localeCompare(b.name));
            children.forEach(c => result.push(c));
        }
    });


    return result;
}