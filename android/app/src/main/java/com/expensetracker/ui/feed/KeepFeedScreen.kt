package com.expensetracker.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import com.expensetracker.ui.theme.BackgroundChalk
import com.expensetracker.ui.theme.PrimaryBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KeepFeedScreen(
    currentMode: ExpenseMode,
    onModeChange: (ExpenseMode) -> Unit,
    dateGroups: List<DateGroup>,
    pinnedExpenses: List<Expense>,
    onAddExpense: () -> Unit,
    onEditExpense: (Expense) -> Unit,
    onTogglePin: (Expense) -> Unit,
    onLockSession: () -> Unit,
    onOpenAnalytics: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        containerColor = BackgroundChalk,
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddExpense,
                containerColor = PrimaryBlue,
                contentColor = Color.White,
                shape = RoundedCornerShape(18.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Expense", modifier = Modifier.size(28.dp))
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Keep Top Omnibar
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.White,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = Color(0xFF94A3B8))
                    Spacer(modifier = Modifier.width(10.dp))
                    TextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search FemSpen...", fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    IconButton(onClick = onOpenAnalytics) {
                        Icon(Icons.Default.PieChart, contentDescription = "Analytics", tint = Color(0xFF64748B))
                    }

                    IconButton(onClick = onLockSession) {
                        Icon(Icons.Default.Lock, contentDescription = "Lock", tint = PrimaryBlue)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Individual vs Family Mode Switcher Pill
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                    .padding(4.dp)
            ) {
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onModeChange(ExpenseMode.INDIVIDUAL) },
                    color = if (currentMode == ExpenseMode.INDIVIDUAL) Color.White else Color.Transparent,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = if (currentMode == ExpenseMode.INDIVIDUAL) PrimaryBlue else Color(0xFF64748B),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Individual",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (currentMode == ExpenseMode.INDIVIDUAL) Color(0xFF0F172A) else Color(0xFF64748B)
                        )
                    }
                }

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onModeChange(ExpenseMode.FAMILY) },
                    color = if (currentMode == ExpenseMode.FAMILY) Color.White else Color.Transparent,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Group,
                            contentDescription = null,
                            tint = if (currentMode == ExpenseMode.FAMILY) Color(0xFF10B981) else Color(0xFF64748B),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Family",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (currentMode == ExpenseMode.FAMILY) Color(0xFF0F172A) else Color(0xFF64748B)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Date Grouped Feed
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // PINNED SECTION
                if (pinnedExpenses.isNotEmpty()) {
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "PINNED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B)
                            )
                        }
                    }

                    items(pinnedExpenses) { exp ->
                        KeepExpenseCard(
                            expense = exp,
                            onCardClick = onEditExpense,
                            onTogglePin = onTogglePin
                        )
                    }
                }

                // DATE GROUPS
                for (group in dateGroups) {
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
                                    color = Color(0xFF64748B)
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFE2E8F0)
                                ) {
                                    Text(
                                        text = "$%.2f".format(group.totalAmount),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF1E293B),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }

                        items(unpinned) { exp ->
                            KeepExpenseCard(
                                expense = exp,
                                onCardClick = onEditExpense,
                                onTogglePin = onTogglePin
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(80.dp))
                }
            }
        }
    }
}
