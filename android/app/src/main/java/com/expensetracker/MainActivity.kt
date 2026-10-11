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
import com.expensetracker.ui.auth.LoginScreen
import com.expensetracker.ui.auth.PinLockScreen
import com.expensetracker.ui.components.MemberUiModel
import com.expensetracker.ui.components.ProfileModal
import com.expensetracker.ui.components.ThemeCustomizerDialog
import com.expensetracker.ui.editor.ExpenseEditorSheet
import com.expensetracker.ui.feed.KeepFeedScreen
import com.expensetracker.ui.goals.GoalsScreen
import com.expensetracker.ui.goals.SavingsGoal
import com.expensetracker.ui.analytics.SpendChartsScreen
import com.expensetracker.ui.navigation.BottomNavTab
import com.expensetracker.ui.navigation.CenterDockBottomBar
import com.expensetracker.ui.recurring.RecurringBillsScreen
import com.expensetracker.ui.settings.SettingsScreen
import com.expensetracker.ui.theme.ExpenseTrackerTheme
import com.expensetracker.ui.theme.ThemePreferences
import com.expensetracker.utils.ExportUtils
import com.expensetracker.ui.wallet.WalletScreen
import com.expensetracker.ui.wallet.WalletTx
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
    private var transactionsListener: ListenerRegistration? = null
    private var goalsListener: ListenerRegistration? = null
    private var familyListener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Native Splash Screen integration
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val themePrefs = ThemePreferences(this)

        setContent {
            var themeMode by remember { mutableStateOf(themePrefs.themeMode) }
            var darkSlider by remember { mutableFloatStateOf(themePrefs.darkIntensitySlider) }
            var isThemeDialogOpen by remember { mutableStateOf(false) }

            ExpenseTrackerTheme(
                themeMode = themeMode,
                darkIntensitySlider = darkSlider
            ) {
                var isAuthenticated by remember { mutableStateOf(auth.currentUser != null) }
                var isPinLocked by remember { mutableStateOf(true) }
                var userEmail by remember { mutableStateOf(auth.currentUser?.email ?: "") }

                // Default mode is FAMILY mode as requested
                var currentMode by remember { mutableStateOf(ExpenseMode.FAMILY) }
                var currentNavTab by remember { mutableStateOf(BottomNavTab.FEED) }

                // Profile and Family State
                var userDisplayName by remember { mutableStateOf("") }
                var userCurrency by remember { mutableStateOf("INR") }
                var familyId by remember { mutableStateOf<String?>(null) }
                var familyName by remember { mutableStateOf<String?>(null) }
                var familyHeadName by remember { mutableStateOf<String?>(null) }
                var familyInviteCode by remember { mutableStateOf<String?>(null) }
                var familyMembers by remember { mutableStateOf<List<MemberUiModel>>(emptyList()) }
                var isProfileOpen by remember { mutableStateOf(false) }

                // Wallet & Goals State
                var walletBalance by remember { mutableDoubleStateOf(0.0) }
                var walletTransactions by remember { mutableStateOf<List<WalletTx>>(emptyList()) }
                var savingsGoals by remember { mutableStateOf<List<SavingsGoal>>(emptyList()) }
                var isLoadingData by remember { mutableStateOf(true) }

                // Expenses State
                var allExpenses by remember { mutableStateOf<List<Expense>>(emptyList()) }
                var editingExpense by remember { mutableStateOf<Expense?>(null) }
                var isEditorOpen by remember { mutableStateOf(false) }
                var isAnalyticsOpen by remember { mutableStateOf(false) }
                var isRecurringOpen by remember { mutableStateOf(false) }

                val currencySymbol = remember(userCurrency) {
                    when (userCurrency.uppercase()) {
                        "USD" -> "$"
                        "EUR" -> "€"
                        "GBP" -> "£"
                        else -> "₹"
                    }
                }

                // 1. Listen to User Profile & Family info
                LaunchedEffect(isAuthenticated) {
                    val uid = auth.currentUser?.uid
                    profileListener?.remove()
                    familyListener?.remove()

                    if (isAuthenticated && uid != null) {
                        try {
                            profileListener = db.collection("users").document(uid)
                                .addSnapshotListener { snapshot, _ ->
                                    if (snapshot != null && snapshot.exists()) {
                                        val dbName = snapshot.getString("displayName")
                                        userDisplayName = if (!dbName.isNullOrBlank() && !dbName.contains("@")) {
                                            dbName.trim()
                                        } else {
                                            auth.currentUser?.displayName ?: (auth.currentUser?.email?.substringBefore("@") ?: "User")
                                        }
                                        userCurrency = snapshot.getString("currency") ?: "INR"
                                        familyId = snapshot.getString("familyId")
                                        familyName = snapshot.getString("familyName")
                                    } else {
                                        val emailPrefix = auth.currentUser?.email?.substringBefore("@") ?: "User"
                                        userDisplayName = auth.currentUser?.displayName ?: emailPrefix
                                    }
                                }
                        } catch (e: Exception) {
                            Log.e("FemSpen", "Profile listener error", e)
                        }
                    }
                }

                // 2. Listen to Family Doc when familyId is active
                LaunchedEffect(familyId) {
                    familyListener?.remove()
                    val fid = familyId
                    if (!fid.isNullOrBlank()) {
                        familyListener = db.collection("families").document(fid)
                            .addSnapshotListener { snap, _ ->
                                if (snap != null && snap.exists()) {
                                    familyName = snap.getString("name") ?: "My Family"
                                    familyInviteCode = snap.getString("inviteCode")

                                    val rawMembers = snap.get("members") as? List<Map<String, Any>>
                                    val headFromDoc = snap.getString("headName")
                                    val headFromMembers = rawMembers?.firstOrNull { (it["role"]?.toString() ?: "").equals("head", ignoreCase = true) }?.get("displayName")?.toString()
                                    familyHeadName = if (!headFromDoc.isNullOrBlank() && !headFromDoc.contains("@")) {
                                        headFromDoc.trim()
                                    } else if (!headFromMembers.isNullOrBlank() && !headFromMembers.contains("@")) {
                                        headFromMembers.trim()
                                    } else {
                                        headFromDoc ?: "Family Head"
                                    }
                                    if (rawMembers != null) {
                                        familyMembers = rawMembers.map { m ->
                                            val mUid = m["uid"]?.toString() ?: ""
                                            val mName = m["displayName"]?.toString() ?: "Member"
                                            val mRole = m["role"]?.toString() ?: "member"
                                            MemberUiModel(
                                                uid = mUid,
                                                name = mName,
                                                role = mRole,
                                                isHead = mRole.equals("head", ignoreCase = true)
                                            )
                                        }
                                    }
                                }
                            }
                    }
                }

                // 3. Dynamic Real-time Wallet Listener & Auto-initialization
                LaunchedEffect(isAuthenticated, currentMode, familyId) {
                    val uid = auth.currentUser?.uid
                    walletListener?.remove()
                    transactionsListener?.remove()

                    if (isAuthenticated && uid != null) {
                        val walletRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                            db.collection("families").document(familyId!!).collection("wallets").document(uid)
                        } else {
                            db.collection("users").document(uid).collection("wallet").document("main")
                        }

                        walletListener = walletRef.addSnapshotListener { snap, _ ->
                            if (snap != null && snap.exists()) {
                                walletBalance = snap.getDouble("balance") ?: 0.0
                            } else {
                                // If wallet document does not exist yet, auto-create it with starting funds
                                val initialBal = 25000.0
                                walletRef.set(
                                    hashMapOf(
                                        "balance" to initialBal,
                                        "currency" to userCurrency,
                                        "ownerUserId" to uid,
                                        "updatedAt" to FieldValue.serverTimestamp()
                                    )
                                )
                                walletBalance = initialBal
                            }
                        }

                        // Listen to Wallet Transactions
                        val txRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                            db.collection("families").document(familyId!!).collection("wallet_transactions")
                        } else {
                            db.collection("users").document(uid).collection("wallet_transactions")
                        }

                        transactionsListener = txRef
                            .orderBy("timestamp", Query.Direction.DESCENDING)
                            .limit(25)
                            .addSnapshotListener { snap, _ ->
                                if (snap != null) {
                                    walletTransactions = snap.documents.mapNotNull { d ->
                                        val title = d.getString("title") ?: "Transaction"
                                        val amt = d.getDouble("amount") ?: 0.0
                                        val isCredit = d.getBoolean("isCredit") ?: false
                                        val cat = d.getString("category") ?: "General"
                                        val time = d.getTimestamp("timestamp")?.toDate()?.time ?: System.currentTimeMillis()
                                        WalletTx(id = d.id, title = title, amount = amt, isCredit = isCredit, category = cat, timestamp = time)
                                    }
                                }
                            }
                    }
                }

                // 4. Real-time Goals Listener
                LaunchedEffect(isAuthenticated, currentMode, familyId) {
                    val uid = auth.currentUser?.uid
                    goalsListener?.remove()

                    if (isAuthenticated && uid != null) {
                        val goalsRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                            db.collection("families").document(familyId!!).collection("goals")
                        } else {
                            db.collection("users").document(uid).collection("goals")
                        }

                        goalsListener = goalsRef.addSnapshotListener { snap, _ ->
                            if (snap != null) {
                                savingsGoals = snap.documents.mapNotNull { d ->
                                    val title = d.getString("title") ?: ""
                                    val targetAmt = d.getDouble("targetAmount") ?: 0.0
                                    val curAmt = d.getDouble("currentAmount") ?: 0.0
                                    val cat = d.getString("category") ?: "Savings"
                                    val deadline = d.getString("deadline") ?: "2026-12-31"
                                    SavingsGoal(id = d.id, title = title, targetAmount = targetAmt, currentAmount = curAmt, category = cat, deadline = deadline)
                                }
                            }
                        }
                    }
                }

                // 5. Real-time Expenses Listener
                LaunchedEffect(isAuthenticated, currentMode, familyId) {
                    val uid = auth.currentUser?.uid
                    expensesListener?.remove()

                    if (isAuthenticated && uid != null) {
                        isLoadingData = true
                        val expRef = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                            db.collection("families").document(familyId!!).collection("expenses")
                        } else {
                            db.collection("users").document(uid).collection("expenses")
                        }

                        expensesListener = expRef
                            .orderBy("createdAt", Query.Direction.DESCENDING)
                            .addSnapshotListener { snap, _ ->
                                isLoadingData = false
                                if (snap != null) {
                                    allExpenses = snap.documents.mapNotNull { doc ->
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
                                }
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
                        groups.add(DateGroup("Today", todayExpenses.filter { !it.isPinned }.sumOf { it.amount }, todayExpenses))
                    }
                    if (yesterdayExpenses.isNotEmpty()) {
                        groups.add(DateGroup("Yesterday", yesterdayExpenses.filter { !it.isPinned }.sumOf { it.amount }, yesterdayExpenses))
                    }
                    if (otherExpenses.isNotEmpty()) {
                        groups.add(DateGroup("Earlier", otherExpenses.filter { !it.isPinned }.sumOf { it.amount }, otherExpenses))
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
                            onError = { _ ->
                                // Keep keypad ready
                            }
                        )
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
                                Toast.makeText(this@MainActivity, "Use your secret security question on Web or PIN 1234 to reset", Toast.LENGTH_LONG).show()
                            }
                        )
                    }
                    else -> {
                        Scaffold(
                            bottomBar = {
                                CenterDockBottomBar(
                                    currentTab = currentNavTab,
                                    onTabSelected = { tab -> currentNavTab = tab },
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
                                when (currentNavTab) {
                                    BottomNavTab.FEED -> {
                                        val isHead = !familyHeadName.isNullOrBlank() && familyHeadName.equals(userDisplayName, ignoreCase = true)
                                        KeepFeedScreen(
                                            userName = userDisplayName,
                                            walletBalance = walletBalance,
                                            currencySymbol = currencySymbol,
                                            currentMode = currentMode,
                                            onModeChange = { currentMode = it },
                                            dateGroups = dateGroups,
                                            pinnedExpenses = pinnedExpenses,
                                            savingsGoals = savingsGoals,
                                            isFamilyHead = isHead,
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
                                            onOpenThemeSettings = { isThemeDialogOpen = true },
                                            onProfileClick = { isProfileOpen = true },
                                            onBalanceClick = { currentNavTab = BottomNavTab.WALLET },
                                            onOpenWallet = { currentNavTab = BottomNavTab.WALLET },
                                            onOpenAddMoney = { currentNavTab = BottomNavTab.WALLET },
                                            onRequestMoney = { currentNavTab = BottomNavTab.WALLET },
                                            onTransferMoney = { currentNavTab = BottomNavTab.WALLET },
                                            onOpenGoals = { currentNavTab = BottomNavTab.GOALS },
                                            onCreateGoal = { currentNavTab = BottomNavTab.GOALS },
                                            onOpenAnalytics = { isAnalyticsOpen = true }
                                        )
                                    }
                                    BottomNavTab.WALLET -> {
                                        WalletScreen(
                                            currentMode = currentMode,
                                            walletBalance = walletBalance,
                                            currencySymbol = currencySymbol,
                                            transactions = walletTransactions,
                                            onAddMoney = { amt, src, note ->
                                                val uid = auth.currentUser?.uid ?: return@WalletScreen
                                                val walletDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("wallets").document(uid)
                                                } else {
                                                    db.collection("users").document(uid).collection("wallet").document("main")
                                                }
                                                walletDoc.update("balance", FieldValue.increment(amt))

                                                val txDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("wallet_transactions")
                                                } else {
                                                    db.collection("users").document(uid).collection("wallet_transactions")
                                                }
                                                txDoc.add(
                                                    hashMapOf(
                                                        "title" to if (note.isNotBlank()) note else "Wallet Top-up ($src)",
                                                        "amount" to amt,
                                                        "isCredit" to true,
                                                        "category" to "Top-up",
                                                        "timestamp" to FieldValue.serverTimestamp()
                                                    )
                                                )
                                                Toast.makeText(this@MainActivity, "Added %s%.2f to wallet".format(currencySymbol, amt), Toast.LENGTH_SHORT).show()
                                            },
                                            onRequestMoney = { amt, reason ->
                                                if (!familyId.isNullOrBlank()) {
                                                    val uid = auth.currentUser?.uid ?: return@WalletScreen
                                                    db.collection("families").document(familyId!!).collection("wallet_requests").add(
                                                        hashMapOf(
                                                            "requesterUid" to uid,
                                                            "requesterName" to userDisplayName,
                                                            "amount" to amt,
                                                            "reason" to reason,
                                                            "status" to "pending",
                                                            "createdAt" to FieldValue.serverTimestamp()
                                                        )
                                                    )
                                                    Toast.makeText(this@MainActivity, "Money request sent to Family Head", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        )
                                    }
                                    BottomNavTab.GOALS -> {
                                        GoalsScreen(
                                            currentMode = currentMode,
                                            walletBalance = walletBalance,
                                            currencySymbol = currencySymbol,
                                            goals = savingsGoals,
                                            onCreateGoal = { title, target, cat ->
                                                val uid = auth.currentUser?.uid ?: return@GoalsScreen
                                                val goalTarget = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("goals")
                                                } else {
                                                    db.collection("users").document(uid).collection("goals")
                                                }
                                                goalTarget.add(
                                                    hashMapOf(
                                                        "title" to title,
                                                        "targetAmount" to target,
                                                        "currentAmount" to 0.0,
                                                        "category" to cat,
                                                        "createdByUid" to uid,
                                                        "createdAt" to FieldValue.serverTimestamp()
                                                    )
                                                )
                                                Toast.makeText(this@MainActivity, "Goal created: $title", Toast.LENGTH_SHORT).show()
                                            },
                                            onContributeToGoal = { goalId, amt ->
                                                val uid = auth.currentUser?.uid ?: return@GoalsScreen
                                                // 1. Deduct from wallet
                                                val walletDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("wallets").document(uid)
                                                } else {
                                                    db.collection("users").document(uid).collection("wallet").document("main")
                                                }
                                                walletDoc.update("balance", FieldValue.increment(-amt))

                                                // 2. Increment goal saved amount
                                                val goalDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("goals").document(goalId)
                                                } else {
                                                    db.collection("users").document(uid).collection("goals").document(goalId)
                                                }
                                                goalDoc.update("currentAmount", FieldValue.increment(amt))

                                                // 3. Ledger record
                                                val txDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                    db.collection("families").document(familyId!!).collection("wallet_transactions")
                                                } else {
                                                    db.collection("users").document(uid).collection("wallet_transactions")
                                                }
                                                txDoc.add(
                                                    hashMapOf(
                                                        "title" to "Goal Contribution",
                                                        "amount" to amt,
                                                        "isCredit" to false,
                                                        "category" to "Goals",
                                                        "timestamp" to FieldValue.serverTimestamp()
                                                    )
                                                )
                                                Toast.makeText(this@MainActivity, "Contributed %s%.2f to goal!".format(currencySymbol, amt), Toast.LENGTH_SHORT).show()
                                            }
                                        )
                                    }
                                    BottomNavTab.SETTINGS -> {
                                        SettingsScreen(
                                            userName = userDisplayName,
                                            userEmail = userEmail,
                                            userCurrency = userCurrency,
                                            currentThemeMode = themeMode,
                                            currentDarkSlider = darkSlider,
                                            onThemeModeChange = {
                                                themeMode = it
                                                themePrefs.themeMode = it
                                            },
                                            onDarkSliderChange = {
                                                darkSlider = it
                                                themePrefs.darkIntensitySlider = it
                                            },
                                            onCurrencyChange = { code ->
                                                userCurrency = code
                                                val uid = auth.currentUser?.uid
                                                if (uid != null) {
                                                    db.collection("users").document(uid).update("currency", code)
                                                }
                                                Toast.makeText(this@MainActivity, "Currency updated to $code", Toast.LENGTH_SHORT).show()
                                            },
                                            onOpenProfile = { isProfileOpen = true },
                                            onLockSession = { isPinLocked = true },
                                            onSignOut = {
                                                auth.signOut()
                                                isAuthenticated = false
                                                isPinLocked = true
                                            },
                                            onOpenAnalytics = { isAnalyticsOpen = true },
                                            onOpenRecurring = { isRecurringOpen = true },
                                            onExportCSV = {
                                                ExportUtils.exportExpensesToCSV(this@MainActivity, currentExpenses, currentMode.name)
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Profile & Account Modal
                        if (isProfileOpen) {
                            ProfileModal(
                                userName = userDisplayName,
                                userEmail = userEmail,
                                familyId = familyId,
                                familyName = familyName,
                                familyHeadName = familyHeadName,
                                familyInviteCode = familyInviteCode,
                                members = familyMembers,
                                onUpdateName = { newName ->
                                    val uid = auth.currentUser?.uid ?: return@ProfileModal
                                    userDisplayName = newName
                                    db.collection("users").document(uid).update("displayName", newName)
                                    if (!familyId.isNullOrBlank() && familyHeadName == userDisplayName) {
                                        db.collection("families").document(familyId!!).update("headName", newName)
                                    }
                                },
                                onCreateFamily = { newFamName ->
                                    val uid = auth.currentUser?.uid ?: return@ProfileModal
                                    val newFamId = "fam_" + Date().time.toString(36)
                                    val code = "FS" + (1000..9999).random()
                                    val headMember = hashMapOf(
                                        "uid" to uid,
                                        "displayName" to userDisplayName,
                                        "role" to "head",
                                        "joinedAt" to System.currentTimeMillis()
                                    )
                                    val famData = hashMapOf(
                                        "id" to newFamId,
                                        "name" to newFamName,
                                        "inviteCode" to code,
                                        "headUserId" to uid,
                                        "headName" to userDisplayName,
                                        "members" to listOf(headMember),
                                        "createdAt" to FieldValue.serverTimestamp()
                                    )
                                    db.collection("families").document(newFamId).set(famData)
                                    db.collection("users").document(uid).update(
                                        mapOf("familyId" to newFamId, "familyRole" to "head", "familyName" to newFamName)
                                    )
                                    familyId = newFamId
                                    familyName = newFamName
                                    familyHeadName = userDisplayName
                                    familyInviteCode = code
                                    Toast.makeText(this@MainActivity, "Created family: $newFamName", Toast.LENGTH_SHORT).show()
                                },
                                onJoinFamily = { code ->
                                    val uid = auth.currentUser?.uid ?: return@ProfileModal
                                    db.collection("families").whereEqualTo("inviteCode", code.trim()).get()
                                        .addOnSuccessListener { snap ->
                                            if (!snap.isEmpty) {
                                                val doc = snap.documents[0]
                                                val foundId = doc.id
                                                val newMember = hashMapOf(
                                                    "uid" to uid,
                                                    "displayName" to userDisplayName,
                                                    "role" to "member",
                                                    "joinedAt" to System.currentTimeMillis()
                                                )
                                                doc.reference.update("members", FieldValue.arrayUnion(newMember))
                                                db.collection("users").document(uid).update(
                                                    mapOf("familyId" to foundId, "familyRole" to "member", "familyName" to (doc.getString("name") ?: "Family"))
                                                )
                                                familyId = foundId
                                                Toast.makeText(this@MainActivity, "Joined family successfully!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(this@MainActivity, "Invalid invite code", Toast.LENGTH_LONG).show()
                                            }
                                        }
                                },
                                onSignOut = {
                                    auth.signOut()
                                    isAuthenticated = false
                                    isPinLocked = true
                                    isProfileOpen = false
                                },
                                onDismiss = { isProfileOpen = false }
                            )
                        }

                        // Theme Customizer Dialog
                        if (isThemeDialogOpen) {
                            ThemeCustomizerDialog(
                                currentThemeMode = themeMode,
                                currentDarkSlider = darkSlider,
                                onThemeModeChange = {
                                    themeMode = it
                                    themePrefs.themeMode = it
                                },
                                onDarkSliderChange = {
                                    darkSlider = it
                                    themePrefs.darkIntensitySlider = it
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

                                            // Deduct amount from wallet balance so balance is actively dynamic
                                            val walletDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                db.collection("families").document(familyId!!).collection("wallets").document(uid)
                                            } else {
                                                db.collection("users").document(uid).collection("wallet").document("main")
                                            }
                                            walletDoc.update("balance", FieldValue.increment(-saved.amount))

                                            // Record transaction in ledger
                                            val txDoc = if (currentMode == ExpenseMode.FAMILY && !familyId.isNullOrBlank()) {
                                                db.collection("families").document(familyId!!).collection("wallet_transactions")
                                            } else {
                                                db.collection("users").document(uid).collection("wallet_transactions")
                                            }
                                            txDoc.add(
                                                hashMapOf(
                                                    "title" to saved.title,
                                                    "amount" to saved.amount,
                                                    "isCredit" to false,
                                                    "category" to saved.category,
                                                    "timestamp" to FieldValue.serverTimestamp()
                                                )
                                            )
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

                        // Visual Spend Analytics Modal
                        if (isAnalyticsOpen) {
                            SpendChartsScreen(
                                currentMode = currentMode,
                                expenses = currentExpenses,
                                currencySymbol = currencySymbol,
                                onClose = { isAnalyticsOpen = false }
                            )
                        }

                        // Recurring Subscriptions & Bills Modal
                        if (isRecurringOpen) {
                            RecurringBillsScreen(
                                expenses = currentExpenses,
                                currencySymbol = currencySymbol,
                                onClose = { isRecurringOpen = false },
                                onEditExpense = { exp ->
                                    editingExpense = exp
                                    isEditorOpen = true
                                },
                                onAddNew = {
                                    editingExpense = null
                                    isEditorOpen = true
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
        transactionsListener?.remove()
        goalsListener?.remove()
        familyListener?.remove()
    }
}
