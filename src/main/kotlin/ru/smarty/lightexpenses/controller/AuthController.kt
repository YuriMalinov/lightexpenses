package ru.smarty.lightexpenses.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import ru.smarty.lightexpenses.auth.SecurityUtils
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Controller
open class AuthController @Autowired constructor(
        private val tokenBasedRememberMeServices: TokenBasedRememberMeServices,
        private val securityUtils: SecurityUtils
) {
    @RequestMapping("/remember-login")
    open fun rememberLogin(request: HttpServletRequest, response: HttpServletResponse): String {
        if (securityUtils.isAuthorized()) {
            tokenBasedRememberMeServices.onLoginSuccess(request, response, securityUtils.authentication())
        } else {
            throw HttpForbidden("User is not authorized.")
        }

        return "redirect:/"
    }
}