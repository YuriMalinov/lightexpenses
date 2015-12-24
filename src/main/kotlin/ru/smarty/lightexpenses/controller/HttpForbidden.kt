package ru.smarty.lightexpenses.controller

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.FORBIDDEN)
class HttpForbidden(message: String) : Exception(message) {
}