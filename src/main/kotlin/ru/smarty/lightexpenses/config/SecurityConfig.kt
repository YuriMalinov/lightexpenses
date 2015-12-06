package ru.smarty.lightexpenses.config

import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.social.security.SpringSocialConfigurer

@Configuration
open class SecurityConfig : WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.anonymous()
                .and().rememberMe()
                .and().apply(SpringSocialConfigurer())
                .and().csrf().disable()
    }

//    @Bean open fun providerSignInController(connectionFactoryLocator: ConnectionFactoryLocator, usersConnectionRepository: UsersConnectionRepository): ProviderSignInController {
//        val result = ProviderSignInController(connectionFactoryLocator, usersConnectionRepository, SimpleSignInAdapter(HttpSessionRequestCache()))
//        return result
//    }
//
}