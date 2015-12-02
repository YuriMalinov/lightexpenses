//package ru.smarty.lightexpenses.auth
//
//import org.springframework.social.security.SocialUserDetails
//import org.springframework.social.security.SocialUserDetailsService
//import java.util.concurrent.ConcurrentHashMap
//
//class UserDetailsService : SocialUserDetailsService {
//    private val cache = ConcurrentHashMap<String, SocialUserDetails>()
//
//    override fun loadUserByUserId(userId: String): SocialUserDetails? {
//        return cache.get(userId)
//    }
//}
