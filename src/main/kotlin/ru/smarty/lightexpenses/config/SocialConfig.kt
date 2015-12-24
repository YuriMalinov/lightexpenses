package ru.smarty.lightexpenses.config

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.encrypt.Encryptors
import org.springframework.social.UserIdSource
import org.springframework.social.config.annotation.SocialConfigurerAdapter
import org.springframework.social.connect.ConnectionFactoryLocator
import org.springframework.social.connect.UsersConnectionRepository
import org.springframework.social.connect.jdbc.JdbcUsersConnectionRepository
import org.springframework.social.security.AuthenticationNameUserIdSource
import ru.smarty.lightexpenses.auth.AppConnectionSignUp
import javax.sql.DataSource

@Configuration
open class SocialConfig : SocialConfigurerAdapter() {
    @Autowired
    lateinit var dataSource: DataSource

    @Autowired
    lateinit var signUp: AppConnectionSignUp

    override fun getUsersConnectionRepository(connectionFactoryLocator: ConnectionFactoryLocator): UsersConnectionRepository {
        val repository = JdbcUsersConnectionRepository(dataSource, connectionFactoryLocator, Encryptors.noOpText())
        repository.setTablePrefix("lightexpenses.")
        repository.setConnectionSignUp(signUp)
        return repository
    }

    override fun getUserIdSource(): UserIdSource = AuthenticationNameUserIdSource()
}
