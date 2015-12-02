package ru.smarty.lightexpenses.config

import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.social.config.annotation.ConnectionFactoryConfigurer
import org.springframework.social.config.annotation.SocialConfigurerAdapter
import org.springframework.social.facebook.connect.FacebookConnectionFactory

@Configuration
open class SocialConfig : SocialConfigurerAdapter() {
    override fun addConnectionFactories(connectionFactoryConfigurer: ConnectionFactoryConfigurer, environment: Environment) {
//        connectionFactoryConfigurer.addConnectionFactory(FacebookConnectionFactory("182138022132672", "f10746b3436ba2648b5e861aa7906c74"))
    }
}
