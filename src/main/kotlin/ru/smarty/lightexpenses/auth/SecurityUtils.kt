package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.social.facebook.api.Facebook
import org.springframework.social.facebook.api.User
import org.springframework.stereotype.Service

/**
 * TODO: Забыл описание класса сделать, да?
 */
@Service
class SecurityUtils @Autowired constructor(
        private val facebook: Facebook
) {
    fun isAuthorized(): Boolean {
        try {
            return facebook.isAuthorized
        } catch (e: NullPointerException) {
            return false
        }
    }

    fun getUserName(): String? {
        if (isAuthorized()) {
            val user = facebook.fetchObject("me", User::class.java, "name")
            return "${user.name}"
        } else {
            return null
        }
    }
}