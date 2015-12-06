package ru.smarty.lightexpenses.auth

import org.springframework.security.core.GrantedAuthority
import org.springframework.social.security.SocialUser

/**
 * Штука для получения полных данных в авторизации...
 */
class AppUserDetails(val appUserId: String, username: String?, password: String?, enabled: Boolean, accountNonExpired: Boolean, credentialsNonExpired: Boolean, accountNonLocked: Boolean, authorities: MutableCollection<out GrantedAuthority>?) :
        SocialUser(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities) {
    override fun getUserId(): String = appUserId
}