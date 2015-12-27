package ru.smarty.lightexpenses.auth

import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import ru.smarty.lightexpenses.model.AppUser

@Service
class SecurityUtils {
    fun userId(): String = user()?.userId ?: "anonymous"

    fun user(): AppUserDetails? = authentication().principal as? AppUserDetails

    fun appUser(): AppUser? = user()?.user

    fun authentication(): Authentication = SecurityContextHolder.getContext().authentication

    fun isAuthorized(): Boolean = user() != null

    fun getUserName(): String? = user()?.realName
}