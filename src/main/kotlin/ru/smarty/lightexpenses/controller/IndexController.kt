package ru.smarty.lightexpenses.controller

import org.springframework.social.facebook.api.Facebook
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import javax.inject.Inject

@Controller
open class IndexController @Inject constructor(
        private val facebook: Facebook
) {
    @RequestMapping("/")
    fun index(): String {
//        println(facebook.isAuthorized)
        return "index"
    }
}