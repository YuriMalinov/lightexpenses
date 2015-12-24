package ru.smarty.lightexpenses.auth

import org.springframework.security.core.GrantedAuthority
import org.springframework.social.security.SocialUser

/**
 * Штука для получения полных данных в авторизации...
 */
class AppUserDetails(val userName: String, val realName: String, password: String?, enabled: Boolean, accountNonExpired: Boolean, credentialsNonExpired: Boolean, accountNonLocked: Boolean, authorities: MutableCollection<out GrantedAuthority>?) :
        SocialUser(userName, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities) {
    override fun getUserId(): String = userName
}