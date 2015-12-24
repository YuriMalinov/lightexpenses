package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.social.security.SocialUserDetails
import org.springframework.social.security.SocialUserDetailsService
import org.springframework.stereotype.Service
import ru.smarty.lightexpenses.model.AppUser
import ru.smarty.lightexpenses.model.UserRepository

/**
 * Замена : на ! идёт потому, что RememberMe хранит токен с разделителем : и получается упс.
 */
@Service
class AppUserDetailsService @Autowired constructor(
        private val userRepository: UserRepository
) : SocialUserDetailsService, UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails? = loadUserByUserId(username.replace('!', ':'))

    override fun loadUserByUserId(userId: String): SocialUserDetails? {
        val user = userRepository.findOne(userId) ?: return null

        return makeUserDetails(user)
    }

    fun makeUserDetails(user: AppUser) = AppUserDetails(user.id.replace(':', '!'), user.name, user.password, true, true, true, true, arrayListOf())
}
