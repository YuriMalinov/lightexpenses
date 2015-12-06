package ru.smarty.lightexpenses

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.social.config.annotation.EnableSocial
//import ru.smarty.lightexpenses.model.CustomRepositoryImpl
import ru.smarty.lightexpenses.model.UserRepository

@SpringBootApplication
//@EnableJpaRepositories(repositoryBaseClass = CustomRepositoryImpl::class, basePackageClasses = arrayOf(UserRepository::class))
open class LightExpensesApplication {
    companion object {
        @JvmStatic fun main(args: Array<String>) {
            SpringApplication.run(LightExpensesApplication::class.java, *args)
        }
    }
}
