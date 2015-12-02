//package ru.smarty.lightexpenses.auth
//
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
//import org.springframework.security.core.context.SecurityContextHolder
//
//object SignInUtils {
//    /**
//     * Programmatically signs in the user with the given the user ID.
//     */
//    fun signin(userId: String) {
//        SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(userId, null, null)
//    }
//}
