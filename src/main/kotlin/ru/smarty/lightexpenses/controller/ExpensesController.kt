package ru.smarty.lightexpenses.controller

import org.joda.time.DateTime
import org.joda.time.LocalDate
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.access.annotation.Secured
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import ru.smarty.lightexpenses.auth.SecurityUtils
import ru.smarty.lightexpenses.model.Expense
import ru.smarty.lightexpenses.model.ExpenseCategoryRepository
import ru.smarty.lightexpenses.model.ExpenseRepository
import java.util.*
import javax.transaction.Transactional

@Suppress("unused")
@Controller
open class ExpensesController @Autowired constructor(
        private val expenseRepository: ExpenseRepository,
        private val categoryRepository: ExpenseCategoryRepository,
        private val security: SecurityUtils
) {
    private val logger = LoggerFactory.getLogger(this.javaClass)

    @RequestMapping("/data/update-expenses", method = arrayOf(RequestMethod.POST))
    @ResponseBody
    @Secured("USER")
    @Transactional
    open fun updateExpenses(@RequestBody updates: Updates): UpdateResult {
        val expenses = updates.expenses
        if (expenses.size < 0) {
            return UpdateResult(emptyList());
        }

        val user = security.appUser()!!

        val existing = expenseRepository.findByUuidIn(expenses.map { it.uuid }).toMapBy { it.uuid }
        val categories = categoryRepository.findByUuidIn(expenses.map { it.categoryId }.toSet()).toMapBy { it.uuid }

        // NOTE: Check existing expenses to prevent update of other's expense
        existing.forEach { if (it.value.expenseCategory.owner != user) throw HttpForbidden("You aren't owner of $it") }
        categories.values.forEach { if (it.owner != user) throw HttpForbidden("You aren't owner of $it") }


        fun copy(expense: Expense, update: ExpenseClient): Expense {
            expense.amount = update.amount
            expense.description = update.description
            expense.date = update.date.toDate()
            expense.createdDate = update.createdDate.toDate()
            expense.uuid = update.uuid
            expense.expenseCategory = categories[update.categoryId] ?: throw IllegalStateException("Unknown category ${update.categoryId}")
            return expense
        }

        val problems = arrayListOf<Problem>()

        expenses.forEach { expense ->
            try {
                val exp = existing[expense.uuid]
                if (expense.trash) {
                    if (exp != null) {
                        expenseRepository.delete(exp)
                    }
                } else if (exp != null) {
                    expenseRepository.save(copy(exp, expense))
                } else {
                    expenseRepository.save(copy(Expense(), expense))
                }

                if (expense.description == "test-error") {
                    throw RuntimeException("Test error")
                }
            } catch (e: Exception) {
                problems.add(Problem(expense, e.javaClass.simpleName + ": " + e.message))
                logger.info(e.message, e);
            }
        }

        return UpdateResult(problems)
    }

    @RequestMapping("/data/load-expenses", method = arrayOf(RequestMethod.GET))
    @ResponseBody
    @Secured("USER")
    open fun loadExpenses(@RequestParam("from") from: LocalDate, @RequestParam("to") to: LocalDate): List<ExpenseClient> {
        return expenseRepository.findByExpenseCategoryOwnerAndDateBetween(security.appUser()!!, from.toDate(), to.toDate()).map {
            ExpenseClient(it.uuid!!, it.expenseCategory.uuid!!, DateTime(it.date), DateTime(it.createdDate), it.amount, it.description, trash = false)
        }
    }

    @Suppress("unused")
    class UpdateResult(val problems: List<Problem>)

    class Problem(val expense: ExpenseClient, val problem: String)

    class ExpenseClient(
            val uuid: UUID,
            val categoryId: UUID,
            val date: DateTime,
            val createdDate: DateTime,
            val amount: Double,
            val description: String?,
            val trash: Boolean)

    class Updates(val expenses: List<ExpenseClient>)
}