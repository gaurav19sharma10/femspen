package com.expensetracker.ui.feed

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.data.model.DateGroup
import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.ui.components.*
import com.expensetracker.ui.goals.SavingsGoal
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KeepFeedScreen(
    userName: String,
    walletBalance: Double,
    currencySymbol: String = "₹",
    currentMode: ExpenseMode,
    onModeChange: (ExpenseMode) -> Unit,
    dateGroups: List<DateGroup>,
    pinnedExpenses: List<Expense>,
    savingsGoals: List<SavingsGoal> = emptyList(),
    isFamilyHead: Boolean = false,
    isLoading: Boolean = false,
    onAddExpense: () -> Unit,
    onEditExpense: (Expense) -> Unit,
    onTogglePin: (Expense) -> Unit,
    onLockSession: () -> Unit,
    onOpenThemeSettings: () -> Unit,
    onProfileClick: () -> Unit = {},
    onBalanceClick: () -> Unit = {},
    onOpenWallet: () -> Unit = {},
    onOpenAddMoney: () -> Unit = {},
    onRequestMoney: () -> Unit = {},
    onTransferMoney: () -> Unit = {},
    onOpenGoals: () -> Unit = {},
    onCreateGoal: () -> Unit = {},
    onOpenAnalytics: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var selectedColor by remember { mutableStateOf<String?>(null) }

    val isDark = LocalIsDarkTheme.current

    // Calculate today's total spend for the greeting card
    val todayTotalSpend = remember(dateGroups) {
        dateGroups.firstOrNull { it.title.equals("Today", ignoreCase = true) }?.totalAmount ?: 0.0
    }

    // Filter helper function
    fun matchesFilter(exp: Expense): Boolean {
        val matchesQuery = searchQuery.isBlank() ||
                exp.title.contains(searchQuery, ignoreCase = true) ||
                exp.category.contains(searchQuery, ignoreCase = true) ||
                exp.notes.contains(searchQuery, ignoreCase = true)
        val matchesCat = selectedCategory == null || exp.category.equals(selectedCategory, ignoreCase = true)
        val matchesCol = selectedColor == null || exp.color.equals(selectedColor, ignoreCase = true)
        return matchesQuery && matchesCat && matchesCol
    }

    val filteredPinned = remember(pinnedExpenses, searchQuery, selectedCategory, selectedColor) {
        pinnedExpenses.filter { matchesFilter(it) }
    }

    val filteredGroups = remember(dateGroups, searchQuery, selectedCategory, selectedColor) {
        dateGroups.mapNotNull { group ->
            val matched = group.expenses.filter { matchesFilter(it) }
            if (matched.isNotEmpty()) {
                group.copy(
                    expenses = matched,
                    totalAmount = matched.filter { !it.isPinned }.sumOf { it.amount }
                )
            } else null
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // 1. Top Balance Header
        if (isLoading) {
            TopBalanceSkeleton()
        } else {
            TopBalanceHeader(
                userName = userName,
                walletBalance = walletBalance,
                currencySymbol = currencySymbol,
                currentMode = currentMode,
                onModeToggle = onModeChange,
                onOpenThemeSettings = onOpenThemeSettings,
                onLockSession = onLockSession,
                onProfileClick = onProfileClick,
                onBalanceClick = onBalanceClick,
                onOpenAnalytics = onOpenAnalytics
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 2. Feed content with Skeleton Loader when fetching
        if (isLoading) {
            HomeGreetingSkeleton()
            Spacer(modifier = Modifier.height(12.dp))
            FeedSkeletonList(count = 3)
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Greeting Card (Line 1: time greeting, Line 2: user name, Line 3: "Let's talk about today's spending")
                item {
                    HomeGreetingCard(
                        userName = userName,
                        todaySpend = todayTotalSpend,
                        currencySymbol = currencySymbol
                    )
                }

                // Interactive Wallet Pill (Balance, Add, Transfer/Request, Negative warning)
                item {
                    WalletPill(
                        walletBalance = walletBalance,
                        currencySymbol = currencySymbol,
                        currentMode = currentMode,
                        isFamilyHead = isFamilyHead,
                        onOpenWallet = onOpenWallet,
                        onAddMoney = onOpenAddMoney,
                        onRequestMoney = onRequestMoney,
                        onTransferMoney = onTransferMoney
                    )
                }

                // Compact Goals Feed Widget (Horizontal carousel with progress meters)
                item {
                    GoalsFeedWidget(
                        goals = savingsGoals,
                        currencySymbol = currencySymbol,
                        onOpenGoals = onOpenGoals,
                        onCreateGoal = onCreateGoal
                    )
                }

                // Category & Color Filter Pills
                item {
                    FilterPills(
                        selectedCategory = selectedCategory,
                        onSelectCategory = { selectedCategory = it },
                        selectedColor = selectedColor,
                        onSelectColor = { selectedColor = it },
                        onClearFilters = {
                            selectedCategory = null
                            selectedColor = null
                        }
                    )
                }

                // Quick Note Input Bar (like Google Keep)
                item {
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = CardDefaults.outlinedCardBorder(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .clickable { onAddExpense() }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Record a new ${currentMode.name.lowercase()} expense...",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                IconButton(onClick = onAddExpense, modifier = Modifier.size(28.dp)) {
                                    Icon(
                                        Icons.Default.Add,
                                        contentDescription = "Add",
                                        tint = PrimaryBlue,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                IconButton(onClick = onAddExpense, modifier = Modifier.size(28.dp)) {
                                    Icon(
                                        Icons.Default.ReceiptLong,
                                        contentDescription = "Receipt",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Compact Search Bar
                item {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = CardDefaults.outlinedCardBorder(),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Search,
                                contentDescription = "Search",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                modifier = Modifier.size(17.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            TextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = {
                                    Text(
                                        "Search expenses or tags...",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                    )
                                },
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = Color.Transparent,
                                    unfocusedContainerColor = Color.Transparent,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                ),
                                modifier = Modifier.weight(1f)
                            )
                            if (searchQuery.isNotBlank()) {
                                IconButton(
                                    onClick = { searchQuery = "" },
                                    modifier = Modifier.size(22.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Clear",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Empty state with handcrafted Vector Art
                if (filteredPinned.isEmpty() && filteredGroups.all { it.expenses.isEmpty() }) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            if (currentMode == ExpenseMode.FAMILY) {
                                FemSpenFamilyArt(size = 150.dp)
                            } else {
                                FemSpenEmptyFeedArt(size = 150.dp)
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = if (searchQuery.isNotBlank() || selectedCategory != null || selectedColor != null)
                                    "No Matching Expenses Found"
                                else
                                    "No ${currentMode.name.lowercase().replaceFirstChar { it.uppercase() }} Expenses Recorded",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (searchQuery.isNotBlank() || selectedCategory != null || selectedColor != null)
                                    "Try clearing your search query or filters to see all entries."
                                else if (currentMode == ExpenseMode.FAMILY)
                                    "Start tracking household bills, shared groceries, and family allowances in real-time."
                                else
                                    "Keep track of your daily coffee, utility bills, or personal savings by recording an expense card.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 24.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = onAddExpense,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Record First Expense", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                // PINNED SECTION
                if (filteredPinned.isNotEmpty()) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "PINNED (${filteredPinned.size})",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                letterSpacing = 1.sp
                            )
                        }
                    }

                    items(filteredPinned, key = { it.id }) { exp ->
                        KeepExpenseCard(
                            expense = exp,
                            currencySymbol = currencySymbol,
                            onCardClick = onEditExpense,
                            onTogglePin = onTogglePin
                        )
                    }
                }

                // DATE GROUPS (Today, Yesterday, Earlier)
                for (group in filteredGroups) {
                    val unpinned = group.expenses.filter { !it.isPinned }
                    if (unpinned.isNotEmpty()) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = group.title.uppercase(),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    letterSpacing = 1.sp
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant
                                ) {
                                    Text(
                                        text = "%s%.2f".format(currencySymbol, group.totalAmount),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }

                        items(unpinned, key = { it.id }) { exp ->
                            KeepExpenseCard(
                                expense = exp,
                                currencySymbol = currencySymbol,
                                onCardClick = onEditExpense,
                                onTogglePin = onTogglePin
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(96.dp))
                }
            }
        }
    }
}
