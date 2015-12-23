package ru.smarty.lightexpenses.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.RequestMapping
import ru.smarty.lightexpenses.auth.SecurityUtils
import javax.servlet.http.HttpServletRequest

@Controller
open class IndexController @Autowired constructor(
        private val securityUtils: SecurityUtils
) {
    @RequestMapping("/")
    fun index(model: Model, request: HttpServletRequest): String {
        model.addAttribute("authorized", securityUtils.isAuthorized())
        model.addAttribute("userName", securityUtils.getUserName())
        return "index"
    }
}