package ru.smarty.lightexpenses.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.annotation.Secured
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod.POST
import org.springframework.web.bind.annotation.ResponseBody
import ru.smarty.lightexpenses.auth.SecurityUtils
import ru.smarty.lightexpenses.model.ExpenseCategory
import ru.smarty.lightexpenses.model.ExpenseCategoryRepository
import ru.smarty.lightexpenses.model.ExpenseRepository
import java.util.*
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
    open fun updateCategories(@RequestBody command: UpdateCommand): List<ExpenseCategoryClient> {
        val user = security.appUser() ?: throw HttpForbidden("User must be authorized to use this method")

        val existingCategoriesById = categoryRepository.findByOwner(user).toMapBy { it.uuid }.toLinkedMap()

        val (trash, live) = command.categories.partition { it.trash }

        // Remove
        trash.forEach {
            val deleted = existingCategoriesById.remove(it.uuid)?.apply { assert(this.owner == user) }
            if (deleted != null) {
                categoryRepository.delete(deleted.id)
            }
        }

        // First add new categories, don't link
        for (category in live) {
            val existing = existingCategoriesById[category.uuid]
            if (existing == null) {
                existingCategoriesById[category.uuid] = categoryRepository.save(ExpenseCategory().apply {
                    this.uuid = category.uuid
                    this.name = category.name
                    this.owner = user
                })
            } else {
                assert(existing.owner == user)
            }
        }

        // Update & set + link
        for (category in live) {
            val existing = existingCategoriesById[category.uuid] ?: throw IllegalStateException("Category should have been added at step before")
            existing.name = category.name
            // In case parent was removed or not in list of this user we get null here
            existing.parentCategory = existingCategoriesById[category.parentCategoryId]

            categoryRepository.save(existing)
        }

        return existingCategoriesById.values.map { ExpenseCategoryClient(it.uuid!!, it.name, it.parentCatgoryId, false) }
    }


    class UpdateCommand(val categories: List<ExpenseCategoryClient> = arrayListOf())

    class ExpenseCategoryClient(val uuid: UUID, val name: String, val parentCategoryId: UUID?, val trash: Boolean)
}