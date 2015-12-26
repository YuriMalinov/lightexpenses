package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import ru.smarty.lightexpenses.model.AppUser
import ru.smarty.lightexpenses.model.UserRepository

@Service
class SecurityUtils @Autowired constructor(
        private val userRepository: UserRepository
) {
    fun userId(): String = user()?.userId ?: "anonymous"

    fun user(): AppUserDetails? = authentication().principal as? AppUserDetails

    fun appUser(): AppUser? {
        return userRepository.findOne(user()?.userId?.replace('!', ':') ?: return null)
    }

    fun authentication(): Authentication = SecurityContextHolder.getContext().authentication

    fun isAuthorized(): Boolean = user() != null

    fun getUserName(): String? = user()?.realName
}