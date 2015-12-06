package ru.smarty.lightexpenses.config

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.encrypt.TextEncryptor
import org.springframework.social.UserIdSource
import org.springframework.social.config.annotation.ConnectionFactoryConfigurer
import org.springframework.social.config.annotation.SocialConfigurerAdapter
import org.springframework.social.connect.Connection
import org.springframework.social.connect.ConnectionFactoryLocator
import org.springframework.social.connect.ConnectionSignUp
import org.springframework.social.connect.UsersConnectionRepository
import org.springframework.social.connect.jdbc.JdbcUsersConnectionRepository
import org.springframework.social.facebook.connect.FacebookConnectionFactory
import org.springframework.social.security.SocialAuthenticationToken
import org.springframework.social.security.SocialUser
import org.springframework.social.security.SocialUserDetails
import org.springframework.stereotype.Service
import ru.smarty.lightexpenses.auth.AppUserDetails
import ru.smarty.lightexpenses.model.UserRepository
import javax.sql.DataSource

@Configuration
open class SocialConfig : SocialConfigurerAdapter() {
    @Autowired
    lateinit var dataSource: DataSource

    @Autowired
    lateinit var signUp: AccountConnectionSignUp

    override fun getUsersConnectionRepository(connectionFactoryLocator: ConnectionFactoryLocator): UsersConnectionRepository {
        val repository = JdbcUsersConnectionRepository(dataSource, connectionFactoryLocator, NoOpEncryptor())
        repository.setTablePrefix("lightexpenses.")
        repository.setConnectionSignUp(signUp)
        return repository
    }

    override fun getUserIdSource(): UserIdSource? {
        return UserIdSource {
            (SecurityContextHolder.getContext().authentication.principal as? AppUserDetails)?.userId ?: "anonymous"
        }
    }

    class NoOpEncryptor : TextEncryptor {
        override fun decrypt(encryptedText: String): String {
            return encryptedText
        }

        override fun encrypt(text: String): String {
            return text
        }

    }

    @Service
    class AccountConnectionSignUp @Autowired constructor(private val userRepository: UserRepository) : ConnectionSignUp {
        override fun execute(connection: Connection<*>): String {
            throw UnsupportedOperationException()
        }
    }
}
