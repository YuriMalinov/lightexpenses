//package ru.smarty.lightexpenses.config
//
//import org.springframework.context.annotation.Bean
//import org.springframework.context.annotation.Configuration
//import org.springframework.security.config.annotation.web.builders.HttpSecurity
//import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
//import org.springframework.security.web.savedrequest.HttpSessionRequestCache
//import org.springframework.social.connect.ConnectionFactoryLocator
//import org.springframework.social.connect.UsersConnectionRepository
//import org.springframework.social.connect.web.ProviderSignInController
//import org.springframework.social.security.SocialUserDetailsService
//import org.springframework.social.security.SpringSocialConfigurer
//import ru.smarty.lightexpenses.auth.SimpleSignInAdapter
//import ru.smarty.lightexpenses.auth.UserDetailsService
//
////@Configuration
////open class SecurityConfig : WebSecurityConfigurerAdapter() {
////    override fun configure(http: HttpSecurity) {
////        http.anonymous()
////                .and().rememberMe()
////                .and().apply(SpringSocialConfigurer())
////    }
////
////    @Bean open fun providerSignInController(connectionFactoryLocator: ConnectionFactoryLocator, usersConnectionRepository: UsersConnectionRepository): ProviderSignInController {
////        val result = ProviderSignInController(connectionFactoryLocator, usersConnectionRepository, SimpleSignInAdapter(HttpSessionRequestCache()))
////        return result
////    }
////
////    @Bean open fun socialUserDetailsService(): SocialUserDetailsService {
////        return UserDetailsService()
////    }
//}