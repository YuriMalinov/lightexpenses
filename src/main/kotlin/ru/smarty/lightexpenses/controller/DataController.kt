package ru.smarty.lightexpenses.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.annotation.Secured
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod.POST
import org.springframework.web.bind.annotation.ResponseBody
import ru.smarty.lightexpenses.auth.SecurityUtils
import ru.smarty.lightexpenses.model.ExpenseCategory
import ru.smarty.lightexpenses.model.ExpenseCategoryRepository
import ru.smarty.lightexpenses.model.ExpenseRepository
import javax.transaction.Transactional

@Controller
open class DataController @Autowired constructor(
        private val categoryRepository: ExpenseCategoryRepository,
        private val expenseRepository: ExpenseRepository,
        private val security: SecurityUtils
) {
    @RequestMapping("/data/categories")
    @Secured("USER")
    open fun categories(): List<ExpenseCategory> {
        return categoryRepository.findByOwner(security.appUser() ?: return listOf())
    }

    @RequestMapping("/data/sync-categories", method = arrayOf(POST))
    @ResponseBody
    @Secured("USER")
    @Transactional
    open fun updateCategories(clientCategories: List<ExpenseCategoryUpdate>): List<ExpenseCategory> {
        val user = security.appUser() ?: throw HttpForbidden("User must be authorized to use this method")

        val existingCategoriesById = categoryRepository.findByOwner(user).toMapBy { it.id }.toLinkedMap()

        val (trash, live) = clientCategories.partition { it.trash }

        // Remove
        trash.forEach { existingCategoriesById.remove(it.id) }

        // First add new categories, don't link
        for (category in live) {
            if (category.id !in existingCategoriesById) {
                existingCategoriesById[category.id] = categoryRepository.save(ExpenseCategory().apply {
                    this.id = category.id
                    this.name = category.name
                })
            }
        }

        // Update & set + link
        for (category in live) {
            val existing = existingCategoriesById[category.id] ?: throw IllegalStateException("Category should have been added at step before")
            existing.name = category.name
            // In case parent was removed or not in list of this user we get null here
            existing.parentCategory = existingCategoriesById[category.id]

            categoryRepository.save(existing)
        }

        return existingCategoriesById.values.toList()
    }

    class ExpenseCategoryUpdate : ExpenseCategory() {
        var trash: Boolean = false
    }
}