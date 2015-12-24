package ru.smarty.lightexpenses.config

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices
import org.springframework.security.web.util.matcher.IpAddressMatcher
import org.springframework.social.security.SpringSocialConfigurer
import ru.smarty.lightexpenses.auth.AppUserDetailsService

@Configuration
open class SecurityConfig : WebSecurityConfigurerAdapter() {
    val REMEMBERME_KEY = "FM2SV54rBlU1SvuMngO5qLzrzzNcjUdfD9WyS4Ie"

    override fun configure(http: HttpSecurity) {
        http.apply(
                SpringSocialConfigurer()
                        .postLoginUrl("/remember-login")
                        .alwaysUsePostLoginUrl(true))

                .and().rememberMe()
                .key(REMEMBERME_KEY)
                .tokenValiditySeconds(60 * 60 * 24 * 180)
                .rememberMeServices(rememberMe())

                .and().authorizeRequests()
                .antMatchers("/shutdown").hasIpAddress("127.0.0.1")

                .and().logout().logoutUrl("/logout").logoutSuccessUrl("/")

                .and().csrf().disable()
    }

    @Autowired
    lateinit var userDetails: AppUserDetailsService

    @Bean
    open fun rememberMe() = TokenBasedRememberMeServices(REMEMBERME_KEY, userDetails)
}