package ru.smarty.lightexpenses.model

import org.springframework.data.domain.Persistable
import java.math.BigInteger
import java.security.SecureRandom
import java.util.*
import javax.persistence.*


@MappedSuperclass
open class UuidEntity {
    @get:Id
    open var id: UUID = UUID.randomUUID()
}


@Entity
@Table(name = "app_user", schema = "lightexpenses")
open class AppUser constructor() {
    @get:Id
    open lateinit var id: String

    @get:Column(columnDefinition = "text not null")
    open lateinit var name: String

    @get:Column(columnDefinition = "text", nullable = true)
    open var email: String? = null

    @get:Column(columnDefinition = "text", nullable = false)
    open var password: String = BigInteger(128, random).toString(32)

    @get:OneToMany(targetEntity = ExpenseCategory::class, cascade = arrayOf(CascadeType.ALL), orphanRemoval = true, mappedBy = "owner")
    open var categories: List<ExpenseCategory> = emptyList()

    constructor(id: String, name: String, email: String?) : this() {
        this.id = id
        this.name = name
        this.email = email
    }

    companion object {
        val random = SecureRandom()
    }
}


@Entity
@Table(name = "expense_category", schema = "lightexpenses")
open class ExpenseCategory : UuidEntity() {
    @get:ManyToOne(fetch = FetchType.LAZY, optional = false)
    open lateinit var owner: AppUser

    @get:Column(columnDefinition = "text not null")
    open lateinit var name: String

    @get:ManyToOne(optional = true)
    open var parentCategory: ExpenseCategory? = null
}


@Entity
@Table(name = "expense_category", schema = "lightexpenses")
open class Expense : UuidEntity() {
    @get:ManyToOne
    open lateinit var expenseCategory: ExpenseCategory

    open var amount: Double = 0.0

    open var date: Date = Date()

    @get:Column(columnDefinition = "text not null")
    open var description: String = ""
}