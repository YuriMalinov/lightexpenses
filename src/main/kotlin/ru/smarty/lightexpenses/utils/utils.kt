package ru.smarty.lightexpenses.utils

inline fun <T> T?.orCreate(create: () -> T): T = if (this == null) create() else this
