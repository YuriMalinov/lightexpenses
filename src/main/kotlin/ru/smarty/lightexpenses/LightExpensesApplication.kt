package ru.smarty.lightexpenses

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.social.config.annotation.EnableSocial

@SpringBootApplication
open class LightExpensesApplication {
    companion object {
        @JvmStatic fun main(args: Array<String>) {
            SpringApplication.run(LightExpensesApplication::class.java, *args)
        }
    }
}
