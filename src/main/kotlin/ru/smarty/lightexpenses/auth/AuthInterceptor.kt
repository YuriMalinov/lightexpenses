package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.social.connect.Connection
import org.springframework.social.connect.ConnectionFactory
import org.springframework.social.connect.web.ConnectInterceptor
import org.springframework.social.facebook.api.Facebook
import org.springframework.social.facebook.api.User
import org.springframework.social.security.SocialAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.util.MultiValueMap
import org.springframework.web.context.request.WebRequest
import ru.smarty.lightexpenses.model.AppUser
import ru.smarty.lightexpenses.model.UserRepository
import ru.smarty.lightexpenses.utils.orCreate
import javax.persistence.EntityManager

@Service
class AuthInterceptor @Autowired constructor(
        private val userRepository: UserRepository,
        private val userDetailsService: AppUserDetailsService,
        private val entityManager: EntityManager, // Потому что репозиторий не умеет делать persist. А разворачивать кутерьму с катомной базой - довольно хлопотно.
        private val transactionTemplate: TransactionTemplate, // Если использовать @Transactional получим прокси, который потряет тип Generic-а, и наш интерсептор сядет не туда.
        private val authenticationManager: AuthenticationManager
) : ConnectInterceptor<Facebook> {

    override fun postConnect(connection: Connection<Facebook>, request: WebRequest?) {
        val userId = connection.key.toString()
        transactionTemplate.execute {
            var user = userRepository.findOne(userId).orCreate {
                val facebook = connection.api
                val facebookUser = facebook.fetchObject("me", User::class.java, "name")

                val appUser = AppUser(userId, facebookUser.name, facebookUser.email)
                // В свою очередь persist - потому, что merge не дружит с отношением Kotlin-а к null-ам.
                entityManager.persist(appUser)
                entityManager.flush()
                appUser
            }

            val token = SocialAuthenticationToken(connection, userDetailsService.makeUserDetails(user), emptyMap(), emptyList())
//            val authenticatedToken = authenticationManager.authenticate(token)
            SecurityContextHolder.getContext().authentication = token
        }
    }

    override fun preConnect(connectionFactory: ConnectionFactory<Facebook>?, parameters: MultiValueMap<String, String>?, request: WebRequest?) {
    }

}