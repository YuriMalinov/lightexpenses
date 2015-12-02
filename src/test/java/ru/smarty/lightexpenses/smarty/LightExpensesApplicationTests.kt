package ru.smarty.lightexpenses.smarty

import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.test.context.web.WebAppConfiguration
import org.springframework.boot.test.SpringApplicationConfiguration
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner
import ru.smarty.lightexpenses.LightExpensesApplication

@RunWith(SpringJUnit4ClassRunner::class)
@SpringApplicationConfiguration(classes = arrayOf(LightExpensesApplication::class))
@WebAppConfiguration
class LightExpensesApplicationTests {

    @Test
    fun contextLoads() {
    }

}
