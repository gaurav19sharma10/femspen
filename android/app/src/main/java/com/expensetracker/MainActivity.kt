package com.expensetracker

import android.os.Bundle
import android.util.Log
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
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : FragmentActivity() {
    private val auth by lazy { FirebaseAuth.getInstance() }
    private val db by lazy { FirebaseFirestore.getInstance() }
    private var firestoreListener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ExpenseTrackerTheme {
                var isAuthenticated by remember { mutableStateOf(auth.currentUser != null) }
                var isPinLocked by remember { mutableStateOf(true) }
                var userEmail by remember { mutableStateOf(auth.currentUser?.email ?: "") }
                var currentMode by remember { mutableStateOf(ExpenseMode.INDIVIDUAL) }

                var allExpenses by remember { mutableStateOf<List<Expense>>(emptyList()) }
                var editingExpense by remember { mutableStateOf<Expense?>(null) }
                var isEditorOpen by remember { mutableStateOf(false) }
                var isAnalyticsOpen by remember { mutableStateOf(false) }

                // Attach real Firestore listener when authenticated
                LaunchedEffect(isAuthenticated) {
                    val uid = auth.currentUser?.uid
                    firestoreListener?.remove()

                    if (isAuthenticated && uid != null) {
                        try {
                            firestoreListener = db.collection("users")
                                .document(uid)
                                .collection("expenses")
                                .orderBy("createdAt", Query.Direction.DESCENDING)
                                .addSnapshotListener { snapshot, error ->
                                    if (error != null) {
                                        Log.w("FemSpen", "Firestore real-time listener notice: ${error.message}")
                                        return@addSnapshotListener
                                    }
                                    if (snapshot != null) {
                                        val list = snapshot.documents.mapNotNull { doc ->
                                            val title = doc.getString("title") ?: ""
                                            val amount = doc.getDouble("amount") ?: 0.0
                                            val category = doc.getString("category") ?: "General"
                                            val mode = doc.getString("mode") ?: ExpenseMode.INDIVIDUAL.name
                                            val color = doc.getString("color") ?: "#F8F7F4"
                                            val isPinned = doc.getBoolean("isPinned") ?: false
                                            val date = doc.getString("date") ?: "Today"
                                            val notes = doc.getString("notes") ?: ""
                                            val familyMember = doc.getString("familyMember")
                                            val isRecurring = doc.getBoolean("isRecurring") ?: false
                                            val recurringInterval = doc.getString("recurringInterval")

                                            Expense(
                                                id = doc.id,
                                                title = title,
                                                amount = amount,
                                                category = category,
                                                mode = mode.uppercase(),
                                                color = color,
                                                isPinned = isPinned,
                                                date = date,
                                                notes = notes,
                                                familyMember = familyMember,
                                                isRecurring = isRecurring,
                                                recurringInterval = recurringInterval
                                            )
                                        }
                                        allExpenses = list
                                    }
                                }
                        } catch (e: Exception) {
                            Log.e("FemSpen", "Error initializing firestore listener", e)
                        }
                    } else {
                        allExpenses = emptyList()
                    }
                }

                val currentExpenses = allExpenses.filter {
                    it.mode.equals(currentMode.name, ignoreCase = true)
                }
                val pinnedExpenses = currentExpenses.filter { it.isPinned }

                // Group into Google Keep date buckets
                val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val todayExpenses = currentExpenses.filter { it.date == "Today" || it.date == todayStr }
                val yesterdayExpenses = currentExpenses.filter { it.date == "Yesterday" }
                val otherExpenses = currentExpenses.filter { it !in todayExpenses && it !in yesterdayExpenses }

                val dateGroups = mutableListOf<DateGroup>()
                if (todayExpenses.isNotEmpty()) {
                    dateGroups.add(
                        DateGroup(
                            title = "Today",
                            totalAmount = todayExpenses.filter { !it.isPinned }.sumOf { it.amount },
                            expenses = todayExpenses
                        )
                    )
                }
                if (yesterdayExpenses.isNotEmpty()) {
                    dateGroups.add(
                        DateGroup(
                            title = "Yesterday",
                            totalAmount = yesterdayExpenses.filter { !it.isPinned }.sumOf { it.amount },
                            expenses = yesterdayExpenses
                        )
                    )
                }
                if (otherExpenses.isNotEmpty()) {
                    dateGroups.add(
                        DateGroup(
                            title = "Earlier",
                            totalAmount = otherExpenses.filter { !it.isPinned }.sumOf { it.amount },
                            expenses = otherExpenses
                        )
                    )
                }

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
                        Toast.makeText(this@MainActivity, "Biometrics not available. Enter PIN to unlock.", Toast.LENGTH_SHORT).show()
                    }
                }

                when {
                    !isAuthenticated -> {
                        LoginScreen(
                            onAuthSuccess = { email, _ ->
                                userEmail = email
                                isAuthenticated = true
                                isPinLocked = true
                            }
                        )
                    }
                    isPinLocked -> {
                        PinLockScreen(
                            userEmail = userEmail,
                            onPinSuccess = { isPinLocked = false },
                            onBiometricRequest = { requestBiometrics() },
                            onForgotPin = {
                                Toast.makeText(this@MainActivity, "Use your secret security question to reset PIN", Toast.LENGTH_LONG).show()
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
                                val uid = auth.currentUser?.uid
                                if (uid != null) {
                                    db.collection("users").document(uid).collection("expenses")
                                        .document(exp.id)
                                        .update("isPinned", !exp.isPinned)
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
                                    val uid = auth.currentUser?.uid
                                    if (uid != null) {
                                        val data = hashMapOf(
                                            "title" to saved.title,
                                            "amount" to saved.amount,
                                            "category" to saved.category,
                                            "mode" to currentMode.name.lowercase(),
                                            "color" to saved.color,
                                            "isPinned" to saved.isPinned,
                                            "date" to if (saved.date.isBlank()) "Today" else saved.date,
                                            "notes" to saved.notes,
                                            "familyMember" to saved.familyMember,
                                            "isRecurring" to saved.isRecurring,
                                            "recurringInterval" to saved.recurringInterval,
                                            "updatedAt" to FieldValue.serverTimestamp()
                                        )

                                        if (editingExpense == null) {
                                            data["createdAt"] = FieldValue.serverTimestamp()
                                            db.collection("users").document(uid).collection("expenses").add(data)
                                        } else {
                                            db.collection("users").document(uid).collection("expenses")
                                                .document(saved.id).update(data as Map<String, Any>)
                                        }
                                    }
                                    isEditorOpen = false
                                },
                                onDelete = { id ->
                                    val uid = auth.currentUser?.uid
                                    if (uid != null) {
                                        db.collection("users").document(uid).collection("expenses")
                                            .document(id).delete()
                                    }
                                    isEditorOpen = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        firestoreListener?.remove()
    }
}
