package com.expensetracker

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.fragment.app.FragmentActivity
import com.expensetracker.data.model.DateGroup
import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.data.security.BiometricAuthHelper
import com.expensetracker.ui.analytics.SpendChartsScreen
import com.expensetracker.ui.auth.LoginScreen
import com.expensetracker.ui.auth.PinLockScreen
import com.expensetracker.ui.components.ThemeCustomizerDialog
import com.expensetracker.ui.editor.ExpenseEditorSheet
import com.expensetracker.ui.feed.KeepFeedScreen
import com.expensetracker.ui.navigation.BottomNavTab
import com.expensetracker.ui.navigation.CenterDockBottomBar
import com.expensetracker.ui.theme.ExpenseTrackerTheme
import com.expensetracker.ui.theme.ThemePreferences
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

    private var expensesListener: ListenerRegistration? = null
    private var profileListener: ListenerRegistration? = null
    private var walletListener: ListenerRegistration? = null
    private var familyListener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Native Splash Screen integration
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val themePrefs = ThemePreferences(this)

        setContent {
            var themeMode by remember { mutableStateOf(themePrefs.themeMode) }
            var darkIntensity by remember { mutableStateOf(themePrefs.darkIntensity) }
            var isThemeDialogOpen by remember { mutableStateOf(false) }

            ExpenseTrackerTheme(
                themeMode = themeMode,
                darkIntensity = darkIntensity
            ) {
                var isAuthenticated by remember { mutableStateOf(auth.currentUser != null) }
                var isPinLocked by remember { mutableStateOf(true) }
                var userEmail by remember { mutableStateOf(auth.currentUser?.email ?: "") }
                var currentMode by remember { mutableStateOf(ExpenseMode.INDIVIDUAL) }
                var currentNavTab by remember { mutableStateOf(BottomNavTab.FEED) }

                // Database Profile State
                var userDisplayName by remember { mutableStateOf("") }
                var userCurrency by remember { mutableStateOf("INR") }
                var familyId by remember { mutableStateOf<String?>(null) }
                var walletBalance by remember { mutableStateOf(0.0) }
                var isLoadingData by remember { mutableStateOf(true) }

                var allExpenses by remember { mutableStateOf<List<Expense>>(emptyList()) }
                var editingExpense by remember { mutableStateOf<Expense?>(null) }
                var isEditorOpen by remember { mutableStateOf(false) }
                var isAnalyticsOpen by remember { mutableStateOf(false) }

                val currencySymbol = remember(userCurrency) {
                    when (userCurrency.uppercase()) {
                        "USD" -> "$"
                        "EUR" -> "€"
                        "GBP" -> "£"
                        else -> "₹"
                    }
                }

                // 1. Listen to User Profile & Wallet from Firestore
                LaunchedEffect(isAuthenticated) {
                    val uid = auth.currentUser?.uid
                    profileListener?.remove()
                    walletListener?.remove()

                    if (isAuthenticated && uid != null) {
                        try {
                            // User document listener
                            profileListener = db.collection("users").document(uid)
                                .addSnapshotListener { snapshot, error ->
                                    if (error != null) {
                                        Log.w("FemSpen", "User profile listener error: ${error.message}")
                                        return@addSnapshotListener
                                    }
                                    if (snapshot != null && snapshot.exists()) {
                                        val dbName = snapshot.getString("displayName")
                                        userDisplayName = if (!dbName.isNullOrBlank() && !dbName.contains("@")) {
                                            dbName.trim()
                                        } else {
                                            auth.currentUser?.displayName ?: (auth.currentUser?.email?.substringBefore("@") ?: "User")
                                        }
                                        userCurrency = snapshot.getString("currency") ?: "INR"
                                        familyId = snapshot.getString("familyId")
                                    } else {
                                        val emailPrefix = auth.currentUser?.email?.substringBefore("@") ?: "User"
                                        userDisplayName = auth.currentUser?.displayName ?: emailPrefix
                                    }
                                }

                            // Individual wallet document listener
                            walletListener = db.collection("users").document(uid)
                                .collection("wallet").document("main")
                                .addSnapshotListener { snapshot, _ ->
                                    if (snapshot != null && snapshot.exists()) {
                                        walletBalance = snapshot.getDouble("balance") ?: 0.0
                                    }
                                }
                        } catch (e: Exception) {
                            Log.e("FemSpen", "Error initializing user/wallet listener", e)
                        }
                    }
                }

                // 2. Realtime 2-way Cross Data Connectivity: Listen to Expenses (Personal vs Family)
                LaunchedEffect(isAuthenticated, currentMode, familyId) {
                    val uid = auth.currentUser?.uid
                    expensesListener?.remove()

                    if (isAuthenticated && uid != null) {
                        isLoadingData = true
                        try {
                            val collectionRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                // Real-time sync with shared family collection
                                db.collection("families").document(familyId!!).collection("expenses")
                            } else {
                                // Real-time sync with personal expenses collection
                                db.collection("users").document(uid).collection("expenses")
                            }

                            expensesListener = collectionRef
                                .orderBy("createdAt", Query.Direction.DESCENDING)
                                .addSnapshotListener { snapshot, error ->
                                    isLoadingData = false
                                    if (error != null) {
                                        Log.w("FemSpen", "Expenses sync warning: ${error.message}")
                                        return@addSnapshotListener
                                    }
                                    if (snapshot != null) {
                                        val list = snapshot.documents.mapNotNull { doc ->
                                            val title = doc.getString("title") ?: ""
                                            val amount = doc.getDouble("amount") ?: 0.0
                                            val category = doc.getString("category") ?: "General"
                                            val mode = doc.getString("mode") ?: currentMode.name
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
                            isLoadingData = false
                            Log.e("FemSpen", "Error initializing expenses listener", e)
                        }
                    } else {
                        allExpenses = emptyList()
                        isLoadingData = false
                    }
                }

                val currentExpenses = remember(allExpenses, currentMode, familyId) {
                    if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                        allExpenses
                    } else {
                        allExpenses.filter { it.mode.equals(currentMode.name, ignoreCase = true) }
                    }
                }

                val pinnedExpenses = remember(currentExpenses) { currentExpenses.filter { it.isPinned } }

                // Group into Keep buckets: Today, Yesterday, Earlier
                val todayStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }
                val todayExpenses = currentExpenses.filter { it.date == "Today" || it.date == todayStr }
                val yesterdayExpenses = currentExpenses.filter { it.date == "Yesterday" }
                val otherExpenses = currentExpenses.filter { it !in todayExpenses && it !in yesterdayExpenses }

                val dateGroups = remember(todayExpenses, yesterdayExpenses, otherExpenses) {
                    val groups = mutableListOf<DateGroup>()
                    if (todayExpenses.isNotEmpty()) {
                        groups.add(
                            DateGroup(
                                title = "Today",
                                totalAmount = todayExpenses.filter { !it.isPinned }.sumOf { it.amount },
                                expenses = todayExpenses
                            )
                        )
                    }
                    if (yesterdayExpenses.isNotEmpty()) {
                        groups.add(
                            DateGroup(
                                title = "Yesterday",
                                totalAmount = yesterdayExpenses.filter { !it.isPinned }.sumOf { it.amount },
                                expenses = yesterdayExpenses
                            )
                        )
                    }
                    if (otherExpenses.isNotEmpty()) {
                        groups.add(
                            DateGroup(
                                title = "Earlier",
                                totalAmount = otherExpenses.filter { !it.isPinned }.sumOf { it.amount },
                                expenses = otherExpenses
                            )
                        )
                    }
                    groups
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
                            currencySymbol = currencySymbol,
                            onClose = { isAnalyticsOpen = false }
                        )
                    }
                    else -> {
                        Scaffold(
                            bottomBar = {
                                CenterDockBottomBar(
                                    currentTab = currentNavTab,
                                    onTabSelected = { tab ->
                                        currentNavTab = tab
                                        when (tab) {
                                            BottomNavTab.FEED -> { /* Already on Feed */ }
                                            BottomNavTab.ANALYTICS -> isAnalyticsOpen = true
                                            BottomNavTab.THEME -> isThemeDialogOpen = true
                                            BottomNavTab.LOCK -> isPinLocked = true
                                        }
                                    },
                                    onAddExpenseClick = {
                                        editingExpense = null
                                        isEditorOpen = true
                                    }
                                )
                            }
                        ) { paddingValues ->
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(bottom = paddingValues.calculateBottomPadding())
                            ) {
                                KeepFeedScreen(
                                    userName = userDisplayName,
                                    walletBalance = walletBalance,
                                    currencySymbol = currencySymbol,
                                    currentMode = currentMode,
                                    onModeChange = { currentMode = it },
                                    dateGroups = dateGroups,
                                    pinnedExpenses = pinnedExpenses,
                                    isLoading = isLoadingData,
                                    onAddExpense = {
                                        editingExpense = null
                                        isEditorOpen = true
                                    },
                                    onEditExpense = { exp ->
                                        editingExpense = exp
                                        isEditorOpen = true
                                    },
                                    onTogglePin = { exp ->
                                        val uid = auth.currentUser?.uid ?: return@KeepFeedScreen
                                        val docRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                            db.collection("families").document(familyId!!).collection("expenses").document(exp.id)
                                        } else {
                                            db.collection("users").document(uid).collection("expenses").document(exp.id)
                                        }
                                        docRef.update("isPinned", !exp.isPinned)
                                    },
                                    onLockSession = { isPinLocked = true },
                                    onOpenThemeSettings = { isThemeDialogOpen = true }
                                )
                            }
                        }

                        // Theme Customizer Dialog
                        if (isThemeDialogOpen) {
                            ThemeCustomizerDialog(
                                currentThemeMode = themeMode,
                                currentDarkIntensity = darkIntensity,
                                onThemeModeChange = {
                                    themeMode = it
                                    themePrefs.themeMode = it
                                },
                                onDarkIntensityChange = {
                                    darkIntensity = it
                                    themePrefs.darkIntensity = it
                                },
                                onDismiss = { isThemeDialogOpen = false }
                            )
                        }

                        // Expense Bottom Sheet Editor
                        if (isEditorOpen) {
                            ExpenseEditorSheet(
                                initialExpense = editingExpense,
                                currentMode = currentMode,
                                currencySymbol = currencySymbol,
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

                                        val targetCollection = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                            data["createdByUid"] = uid
                                            data["createdByName"] = userDisplayName
                                            db.collection("families").document(familyId!!).collection("expenses")
                                        } else {
                                            db.collection("users").document(uid).collection("expenses")
                                        }

                                        if (editingExpense == null) {
                                            data["createdAt"] = FieldValue.serverTimestamp()
                                            targetCollection.add(data)
                                        } else {
                                            targetCollection.document(saved.id).update(data as Map<String, Any>)
                                        }
                                    }
                                    isEditorOpen = false
                                },
                                onDelete = { id ->
                                    val uid = auth.currentUser?.uid
                                    if (uid != null) {
                                        val targetCollection = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                            db.collection("families").document(familyId!!).collection("expenses")
                                        } else {
                                            db.collection("users").document(uid).collection("expenses")
                                        }
                                        targetCollection.document(id).delete()
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
        expensesListener?.remove()
        profileListener?.remove()
        walletListener?.remove()
        familyListener?.remove()
    }
}
