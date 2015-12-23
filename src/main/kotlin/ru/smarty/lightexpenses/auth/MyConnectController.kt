package ru.smarty.lightexpenses.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.social.connect.ConnectionFactoryLocator
import org.springframework.social.connect.ConnectionRepository
import org.springframework.social.connect.DuplicateConnectionException
import org.springframework.social.connect.web.ConnectController
import org.springframework.social.facebook.api.Facebook
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.servlet.view.RedirectView
import javax.servlet.http.HttpServletRequest


@Service
open class MyConnectController @Autowired constructor(
        private val connectionFactoryLocator: ConnectionFactoryLocator,
        private val connectionRepository: ConnectionRepository,
        private val authInterceptor: AuthInterceptor
): ConnectController(connectionFactoryLocator, connectionRepository) {
    override fun connectionStatusRedirect(providerId: String, request: NativeWebRequest): RedirectView {
        val servletRequest = request.getNativeRequest(HttpServletRequest::class.java)
        val duplicate = servletRequest.session.getAttribute(ConnectController.DUPLICATE_CONNECTION_ATTRIBUTE) as DuplicateConnectionException?
        if (duplicate != null) {
            authInterceptor.postConnect(connectionRepository.findPrimaryConnection(Facebook::class.java), null)
        }

        return RedirectView("/")
    }
}