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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.data.model.DateGroup
import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.ui.components.*
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
    isLoading: Boolean = false,
    onAddExpense: () -> Unit,
    onEditExpense: (Expense) -> Unit,
    onTogglePin: (Expense) -> Unit,
    onLockSession: () -> Unit,
    onOpenThemeSettings: () -> Unit,
    onProfileClick: () -> Unit = {},
    onBalanceClick: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    val isDark = LocalIsDarkTheme.current

    // Calculate today's total spend for the greeting card
    val todayTotalSpend = remember(dateGroups) {
        dateGroups.firstOrNull { it.title.equals("Today", ignoreCase = true) }?.totalAmount ?: 0.0
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // 1. Top Balance Header: Profile Avatar + Compact Balance Bar directly beside it
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
                onBalanceClick = onBalanceClick
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 2. Home Greeting Card: Line 1 (Time greeting), Line 2 (User Name), Line 3 ("Let's talk about today's spending")
        if (isLoading) {
            HomeGreetingSkeleton()
        } else {
            HomeGreetingCard(
                userName = userName,
                todaySpend = todayTotalSpend,
                currencySymbol = currencySymbol
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 3. Compact Search Bar
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 1.dp,
            shadowElevation = if (isDark) 0.dp else 1.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Search,
                    contentDescription = "Search",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = {
                        Text(
                            "Search expenses or tags...",
                            fontSize = 13.sp,
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
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Clear search",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Filter feed items based on search query
        val filteredPinned = remember(pinnedExpenses, searchQuery) {
            if (searchQuery.isBlank()) pinnedExpenses
            else pinnedExpenses.filter {
                it.title.contains(searchQuery, ignoreCase = true) ||
                it.category.contains(searchQuery, ignoreCase = true) ||
                it.notes.contains(searchQuery, ignoreCase = true)
            }
        }

        val filteredGroups = remember(dateGroups, searchQuery) {
            if (searchQuery.isBlank()) dateGroups
            else dateGroups.mapNotNull { group ->
                val matched = group.expenses.filter {
                    it.title.contains(searchQuery, ignoreCase = true) ||
                    it.category.contains(searchQuery, ignoreCase = true) ||
                    it.notes.contains(searchQuery, ignoreCase = true)
                }
                if (matched.isNotEmpty()) {
                    group.copy(
                        expenses = matched,
                        totalAmount = matched.filter { !it.isPinned }.sumOf { it.amount }
                    )
                } else null
            }
        }

        // 4. Feed content with Skeleton Loader when fetching
        if (isLoading) {
            FeedSkeletonList(count = 3)
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Empty state when no expenses exist
                if (filteredPinned.isEmpty() && filteredGroups.all { it.expenses.isEmpty() }) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Surface(
                                shape = RoundedCornerShape(24.dp),
                                color = PrimaryBlue.copy(alpha = 0.08f),
                                modifier = Modifier.size(80.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (currentMode == ExpenseMode.FAMILY) Icons.Default.Groups else Icons.Default.ReceiptLong,
                                        contentDescription = null,
                                        tint = PrimaryBlue,
                                        modifier = Modifier.size(38.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = if (searchQuery.isNotBlank()) "No Matching Expenses"
                                else "No ${currentMode.name.lowercase().replaceFirstChar { it.uppercase() }} Expenses Yet",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (searchQuery.isNotBlank())
                                    "Try a different keyword or check your filters."
                                else if (currentMode == ExpenseMode.FAMILY)
                                    "Track shared household bills, groceries, allowances, and vacations."
                                else
                                    "Track your daily coffee, commute, subscriptions, and meals.",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 24.dp)
                            )
                            Spacer(modifier = Modifier.height(18.dp))
                            Button(
                                onClick = onAddExpense,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Add First Expense", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                // PINNED SECTION
                if (filteredPinned.isNotEmpty()) {
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "PINNED",
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

                // DATE GROUPS
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
                    Spacer(modifier = Modifier.height(90.dp))
                }
            }
        }
    }
}
