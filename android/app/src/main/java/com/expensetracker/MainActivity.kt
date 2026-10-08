package com.expensetracker

import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.fragment.app.FragmentActivity
import com.expensetracker.data.model.DateGroup
import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.data.security.BiometricAuthHelper
import com.expensetracker.ui.analytics.SpendChartsScreen
import com.expensetracker.ui.auth.LoginScreen
import com.expensetracker.ui.auth.PinLockScreen
import com.expensetracker.ui.editor.ExpenseEditorSheet
import com.expensetracker.ui.feed.KeepFeedScreen
import com.expensetracker.ui.theme.ExpenseTrackerTheme

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ExpenseTrackerTheme {
                var isAuthenticated by remember { mutableStateOf(false) }
                var isPinLocked by remember { mutableStateOf(true) }
                var userEmail by remember { mutableStateOf("demo@expensetracker.app") }
                var currentMode by remember { mutableStateOf(ExpenseMode.INDIVIDUAL) }

                var editingExpense by remember { mutableStateOf<Expense?>(null) }
                var isEditorOpen by remember { mutableStateOf(false) }
                var isAnalyticsOpen by remember { mutableStateOf(false) }

                // Seed data for instant preview
                var allExpenses by remember {
                    mutableStateOf(
                        listOf(
                            Expense(
                                id = "1",
                                title = "Morning Artisan Coffee & Croissant",
                                amount = 8.50,
                                category = "Food",
                                mode = ExpenseMode.INDIVIDUAL.name,
                                color = "#FFE0B2",
                                isPinned = true,
                                date = "Today",
                                notes = "Espresso bar before deep work sprint"
                            ),
                            Expense(
                                id = "2",
                                title = "Uber Ride to Tech Center",
                                amount = 19.20,
                                category = "Transport",
                                mode = ExpenseMode.INDIVIDUAL.name,
                                color = "#BBDEFB",
                                isPinned = false,
                                date = "Today"
                            ),
                            Expense(
                                id = "3",
                                title = "High-speed Fiber Internet",
                                amount = 69.99,
                                category = "Bills",
                                mode = ExpenseMode.FAMILY.name,
                                color = "#DCEDC8",
                                isPinned = true,
                                familyMember = "Dad",
                                isRecurring = true,
                                recurringInterval = "Monthly",
                                date = "Yesterday"
                            ),
                            Expense(
                                id = "4",
                                title = "Weekly Supermarket & Groceries",
                                amount = 142.80,
                                category = "Food",
                                mode = ExpenseMode.FAMILY.name,
                                color = "#C8E6C9",
                                isPinned = false,
                                familyMember = "Shared",
                                date = "Today",
                                notes = "Pantry items, produce, and fresh milk"
                            )
                        )
                    )
                }

                val currentExpenses = allExpenses.filter { it.mode == currentMode.name }
                val pinnedExpenses = currentExpenses.filter { it.isPinned }

                // Compute simple DateGroups
                val dateGroups = listOf(
                    DateGroup(
                        title = "Today",
                        totalAmount = currentExpenses.filter { it.date == "Today" && !it.isPinned }.sumOf { it.amount },
                        expenses = currentExpenses.filter { it.date == "Today" }
                    ),
                    DateGroup(
                        title = "Yesterday",
                        totalAmount = currentExpenses.filter { it.date == "Yesterday" && !it.isPinned }.sumOf { it.amount },
                        expenses = currentExpenses.filter { it.date == "Yesterday" }
                    )
                )

                fun requestBiometrics() {
                    if (BiometricAuthHelper.canAuthenticate(this@MainActivity)) {
                        BiometricAuthHelper.promptBiometric(
                            activity = this@MainActivity,
                            onSuccess = {
                                isPinLocked = false
                                Toast.makeText(this@MainActivity, "Unlocked via Biometrics", Toast.LENGTH_SHORT).show()
                            },
                            onError = { err ->
                                Toast.makeText(this@MainActivity, err, Toast.LENGTH_SHORT).show()
                            }
                        )
                    } else {
                        Toast.makeText(this@MainActivity, "Biometrics not enrolled. Use PIN 1234.", Toast.LENGTH_LONG).show()
                    }
                }

                when {
                    !isAuthenticated -> {
                        LoginScreen(
                            onLoginSuccess = {
                                isAuthenticated = true
                                isPinLocked = true
                            },
                            onDemoLogin = {
                                isAuthenticated = true
                                isPinLocked = false
                            }
                        )
                    }
                    isPinLocked -> {
                        PinLockScreen(
                            userEmail = userEmail,
                            onPinSuccess = { isPinLocked = false },
                            onBiometricRequest = { requestBiometrics() },
                            onForgotPin = {
                                Toast.makeText(this@MainActivity, "Recovery: Answer security question to reset PIN", Toast.LENGTH_LONG).show()
                            }
                        )
                    }
                    isAnalyticsOpen -> {
                        SpendChartsScreen(
                            currentMode = currentMode,
                            expenses = currentExpenses,
                            onClose = { isAnalyticsOpen = false }
                        )
                    }
                    else -> {
                        KeepFeedScreen(
                            currentMode = currentMode,
                            onModeChange = { currentMode = it },
                            dateGroups = dateGroups,
                            pinnedExpenses = pinnedExpenses,
                            onAddExpense = {
                                editingExpense = null
                                isEditorOpen = true
                            },
                            onEditExpense = { exp ->
                                editingExpense = exp
                                isEditorOpen = true
                            },
                            onTogglePin = { exp ->
                                allExpenses = allExpenses.map {
                                    if (it.id == exp.id) it.copy(isPinned = !it.isPinned) else it
                                }
                            },
                            onLockSession = { isPinLocked = true },
                            onOpenAnalytics = { isAnalyticsOpen = true }
                        )

                        if (isEditorOpen) {
                            ExpenseEditorSheet(
                                initialExpense = editingExpense,
                                currentMode = currentMode,
                                onDismiss = { isEditorOpen = false },
                                onSave = { saved ->
                                    if (editingExpense == null) {
                                        val newId = System.currentTimeMillis().toString()
                                        allExpenses = listOf(saved.copy(id = newId)) + allExpenses
                                    } else {
                                        allExpenses = allExpenses.map { if (it.id == saved.id) saved else it }
                                    }
                                    isEditorOpen = false
                                },
                                onDelete = { id ->
                                    allExpenses = allExpenses.filter { it.id != id }
                                    isEditorOpen = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
