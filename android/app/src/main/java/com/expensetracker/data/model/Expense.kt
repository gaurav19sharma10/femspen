package com.expensetracker.data.model

import com.google.firebase.firestore.DocumentId

enum class ExpenseMode {
    INDIVIDUAL,
    FAMILY
}

data class Expense(
    @DocumentId
    val id: String = "",
    val title: String = "",
    val amount: Double = 0.0,
    val currency: String = "USD",
    val category: String = "General",
    val mode: String = ExpenseMode.INDIVIDUAL.name,
    val color: String = "#F8F7F4",
    val isPinned: Boolean = false,
    val date: String = "", // ISO string or YYYY-MM-DD
    val notes: String = "",
    val familyMember: String? = null,
    val isRecurring: Boolean = false,
    val recurringInterval: String? = null,
    val receiptUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val pinHash: String = "",
    val pinSalt: String = "",
    val securityQuestion: String = "",
    val securityAnswerHash: String = "",
    val currency: String = "USD",
    val individualMonthlyBudget: Double = 2000.0,
    val familyMonthlyBudget: Double = 5000.0,
    val createdAt: Long = System.currentTimeMillis()
)

data class DateGroup(
    val title: String,
    val totalAmount: Double,
    val expenses: List<Expense>
)
