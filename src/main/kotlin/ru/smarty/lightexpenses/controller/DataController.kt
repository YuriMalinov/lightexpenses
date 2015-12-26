package ru.smarty.lightexpenses.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.annotation.Secured
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod.POST
import ru.smarty.lightexpenses.auth.SecurityUtils
import ru.smarty.lightexpenses.model.ExpenseCategory
import ru.smarty.lightexpenses.model.ExpenseCategoryRepository
import ru.smarty.lightexpenses.model.ExpenseRepository

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

    @RequestMapping("/data/update-categories", method = arrayOf(POST))
    open fun updateCategories() {
    }
}