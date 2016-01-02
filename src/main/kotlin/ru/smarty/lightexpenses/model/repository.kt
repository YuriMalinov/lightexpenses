package ru.smarty.lightexpenses.model

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface UserRepository : JpaRepository<AppUser, String>

interface ExpenseCategoryRepository : JpaRepository<ExpenseCategory, Int> {
    fun findByOwner(owner: AppUser): List<ExpenseCategory>

    fun findByUuidIn(uuids: Collection<UUID>): List<ExpenseCategory>
}

interface ExpenseRepository : JpaRepository<Expense, Int> {
    @Query("select e from Expense e where e.expenseCategory.owner = ?1")
    fun findByOwner(owner: AppUser): List<Expense>

    fun findByUuidIn(uuids: List<UUID>): List<Expense>

    fun findByExpenseCategoryOwnerAndDateBetween(owner: AppUser, from: Date, to: Date): List<Expense>
}

//@NoRepositoryBean
//interface CustomRepository<E, ID : Serializable> : JpaRepository<E, ID> {
//    fun persist(entity: E)
//}
//
//@Suppress("UNCHECKED_CAST")
//class CustomRepositoryImpl<E, ID : Serializable>(
//        entityInformation: JpaEntityInformation<E, ID>,
//        private val entityManager: EntityManager) : SimpleJpaRepository<E, ID>(entityInformation, entityManager), CustomRepository<E, ID> {
//    constructor(domainClass: java.lang.Class<E>, em: EntityManager) :
//    this(JpaEntityInformationSupport.getEntityInformation(domainClass, em) as JpaEntityInformation<E, ID>, em) {
//    }
//
//    override fun persist(entity: E) {
//        entityManager.persist(entity)
//    }
//
//}