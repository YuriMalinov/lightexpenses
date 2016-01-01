package ru.smarty.lightexpenses.model

import com.fasterxml.jackson.annotation.JsonIgnore
import org.hibernate.annotations.Type
import org.springframework.data.domain.Persistable
import java.math.BigInteger
import java.security.SecureRandom
import java.util.*
import javax.persistence.*


@MappedSuperclass
open class CommonEntity : Persistable<Int> {
    private var _id: Int = 0

    @get:Type(type = "pg-uuid")
    var uuid: UUID? = null

    fun setId(id: Int) {
        _id = id
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    override fun getId(): Int = _id

    @Transient
    override fun isNew(): Boolean = _id == 0
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

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other?.javaClass != javaClass) return false

        other as AppUser

        if (id != other.id) return false

        return true
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }


}


@Entity
@Table(name = "expense_category", schema = "lightexpenses")
open class ExpenseCategory : CommonEntity() {
    @get:JsonIgnore
    @get:ManyToOne(fetch = FetchType.LAZY, optional = false)
    open lateinit var owner: AppUser

    @get:Column(columnDefinition = "text not null")
    open lateinit var name: String

    @get:JsonIgnore
    @get:ManyToOne(optional = true)
    open var parentCategory: ExpenseCategory? = null

    open val parentCatgoryId: UUID?
        @Transient get() = parentCategory?.uuid
}


@Entity
@Table(name = "expense", schema = "lightexpenses")
open class Expense : CommonEntity() {
    @get:ManyToOne
    open lateinit var expenseCategory: ExpenseCategory

    open var amount: Double = 0.0

    open var date: Date = Date()

    @get:Column(columnDefinition = "text not null")
    open var description: String = ""
}