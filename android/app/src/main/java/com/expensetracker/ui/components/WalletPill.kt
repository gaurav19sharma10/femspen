package com.expensetracker.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue
import kotlin.math.abs

@Composable
fun WalletPill(
    walletBalance: Double,
    currencySymbol: String = "₹",
    currentMode: ExpenseMode,
    isFamilyHead: Boolean = false,
    onOpenWallet: () -> Unit,
    onAddMoney: () -> Unit,
    onRequestMoney: () -> Unit = {},
    onTransferMoney: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var isMenuOpen by remember { mutableStateOf(false) }
    val isDark = LocalIsDarkTheme.current
    val isNegative = walletBalance < 0

    Column(modifier = modifier.fillMaxWidth()) {
        // Horizontal Pill Bar
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = if (isNegative) {
                if (isDark) Color(0xFF3F1318) else Color(0xFFFFF1F2)
            } else {
                MaterialTheme.colorScheme.surface
            },
            tonalElevation = 1.dp,
            shadowElevation = if (isDark) 0.dp else 2.dp,
            border = if (isNegative) {
                CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFF43F5E))
                )
            } else if (isDark) {
                CardDefaults.outlinedCardBorder()
            } else null,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .clickable { onOpenWallet() }
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Icon + Label + Balance
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isNegative) Color(0xFFF43F5E).copy(alpha = 0.15f)
                                else PrimaryBlue.copy(alpha = 0.12f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccountBalanceWallet,
                            contentDescription = "Wallet",
                            tint = if (isNegative) Color(0xFFF43F5E) else PrimaryBlue,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "MY WALLET",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                letterSpacing = 0.8.sp
                            )
                            if (currentMode == ExpenseMode.FAMILY) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFF10B981).copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = "Family",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF10B981),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }

                        Text(
                            text = if (isNegative) {
                                "−%s%.2f".format(currencySymbol, abs(walletBalance))
                            } else {
                                "%s%.2f".format(currencySymbol, walletBalance)
                            },
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isNegative) Color(0xFFF43F5E) else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                // Right: Action Dropdown Trigger
                Box {
                    IconButton(
                        onClick = { isMenuOpen = true },
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(PrimaryBlue)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Wallet Actions",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = isMenuOpen,
                        onDismissRequest = { isMenuOpen = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Add Money", fontWeight = FontWeight.SemiBold) },
                            leadingIcon = {
                                Icon(Icons.Default.AddCircleOutline, contentDescription = null, tint = PrimaryBlue)
                            },
                            onClick = {
                                isMenuOpen = false
                                onAddMoney()
                            }
                        )

                        if (currentMode == ExpenseMode.FAMILY) {
                            if (!isFamilyHead) {
                                DropdownMenuItem(
                                    text = { Text("Request from Head", fontWeight = FontWeight.SemiBold) },
                                    leadingIcon = {
                                        Icon(Icons.Default.Send, contentDescription = null, tint = Color(0xFFF59E0B))
                                    },
                                    onClick = {
                                        isMenuOpen = false
                                        onRequestMoney()
                                    }
                                )
                            } else {
                                DropdownMenuItem(
                                    text = { Text("Transfer to Member", fontWeight = FontWeight.SemiBold) },
                                    leadingIcon = {
                                        Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = Color(0xFF10B981))
                                    },
                                    onClick = {
                                        isMenuOpen = false
                                        onTransferMoney()
                                    }
                                )
                            }
                        }

                        DropdownMenuItem(
                            text = { Text("View Transactions", fontWeight = FontWeight.SemiBold) },
                            leadingIcon = {
                                Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            },
                            onClick = {
                                isMenuOpen = false
                                onOpenWallet()
                            }
                        )
                    }
                }
            }
        }

        // Negative Balance Alert Banner
        AnimatedVisibility(
            visible = isNegative,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFF43F5E).copy(alpha = 0.12f),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFF43F5E).copy(alpha = 0.3f))
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color(0xFFF43F5E),
                        modifier = Modifier.size(15.dp)
                    )
                    Text(
                        text = "Your spending is %s%.2f above available balance.".format(currencySymbol, abs(walletBalance)),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (isDark) Color(0xFFFFB4AB) else Color(0xFF9F1239)
                    )
                }
            }
        }
    }
}
