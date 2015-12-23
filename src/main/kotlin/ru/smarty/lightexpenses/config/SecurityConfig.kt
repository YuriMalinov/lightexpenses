package ru.smarty.lightexpenses.config

import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.web.util.matcher.IpAddressMatcher
import org.springframework.social.security.SpringSocialConfigurer

@Configuration
open class SecurityConfig : WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.anonymous()
                .and().rememberMe().key("FM2SV54rBlU1SvuMngO5qLzrzzNcjUdfD9WyS4Ie")
                .and().apply(SpringSocialConfigurer())
                .and().csrf().disable()

//        http.authorizeRequests()
//                .antMatchers("/shutdown").requestMatcher(IpAddressMatcher("127.0.0.1"))

    }
}