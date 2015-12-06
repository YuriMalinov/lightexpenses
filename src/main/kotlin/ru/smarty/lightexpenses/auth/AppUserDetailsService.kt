package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.social.security.SocialUserDetails
import org.springframework.social.security.SocialUserDetailsService
import org.springframework.stereotype.Service
import ru.smarty.lightexpenses.model.AppUser
import ru.smarty.lightexpenses.model.UserRepository

@Service
class AppUserDetailsService @Autowired constructor(
        private val userRepository: UserRepository
) : SocialUserDetailsService {
    override fun loadUserByUserId(userId: String): SocialUserDetails? {
        val user = userRepository.findOne(userId) ?: return null

        return makeUserDetails(user)
    }

    fun makeUserDetails(user: AppUser) = AppUserDetails(user.id, user.name, "", true, true, true, true, arrayListOf())
}
