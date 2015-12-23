package ru.smarty.lightexpenses.auth

import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

@Service
class SecurityUtils {
    fun userId(): String {
        return user()?.userId ?: "anonymous"
    }

    fun user(): AppUserDetails? {
        return SecurityContextHolder.getContext().authentication.principal as? AppUserDetails
    }

    fun isAuthorized(): Boolean {
        return user() != null
    }

    fun getUserName(): String? {
        if (isAuthorized()) {
            return "${user()!!.username}"
        } else {
            return null
        }
    }
}