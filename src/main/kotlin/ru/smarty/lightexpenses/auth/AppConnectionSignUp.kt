package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.social.connect.Connection
import org.springframework.social.connect.ConnectionSignUp
import org.springframework.social.facebook.api.Facebook
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionTemplate
import ru.smarty.lightexpenses.model.AppUser
import javax.persistence.EntityManager

@Service
class AppConnectionSignUp @Autowired constructor(
        private val transactionTemplate: TransactionTemplate,
        private val entityManager: EntityManager
) : ConnectionSignUp {
    override fun execute(connection: Connection<*>): String {
        val api = connection.api
        val email = when (api) {
            is Facebook -> api.userOperations().userProfile.email
            else -> null
        }

        val user = AppUser(connection.key.toString(), connection.displayName, email)
        // Эта свистопляска из-за связки: не генериуремый PK (задаётся) + Kotlin (nullability)
        // + JPA Data (делает merge вместо persist) + Hibernate (лезет читать свойства, хотя его не просили)
        transactionTemplate.execute {
            entityManager.persist(user)
        }

        return user.id
    }
}