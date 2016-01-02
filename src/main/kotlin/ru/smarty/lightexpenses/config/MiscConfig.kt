package ru.smarty.lightexpenses.config

import com.fasterxml.jackson.datatype.joda.JodaModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
open class MiscConfig {
    @Bean open fun kotlinModule() = KotlinModule()

    @Bean open fun jodaModule() = JodaModule()
}