package com.expensetracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue

@Composable
fun TopBalanceHeader(
    userName: String,
    walletBalance: Double,
    currencySymbol: String = "₹",
    currentMode: ExpenseMode,
    onModeToggle: (ExpenseMode) -> Unit,
    onOpenThemeSettings: () -> Unit,
    onLockSession: () -> Unit,
    onProfileClick: () -> Unit = {},
    onBalanceClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val isDark = LocalIsDarkTheme.current
    val initial = userName.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "U"

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Left Group: Profile Icon + Compact Balance Bar
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Profile Icon (opens Profile modal)
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(PrimaryBlue, Color(0xFF60A5FA))
                        )
                    )
                    .clickable { onProfileClick() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initial,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            }

            // Simple Small Balance Bar next to profile icon (opens Wallet tab)
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 1.dp,
                shadowElevation = if (isDark) 0.dp else 1.dp,
                modifier = Modifier
                    .border(
                        width = 1.dp,
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .clip(RoundedCornerShape(20.dp))
                    .clickable { onBalanceClick() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalanceWallet,
                        contentDescription = "Wallet Balance",
                        tint = PrimaryBlue,
                        modifier = Modifier.size(15.dp)
                    )
                    Text(
                        text = "%s%.2f".format(currencySymbol, walletBalance),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        // Right Group: Mode Switcher + Theme + Lock
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Compact Mode Toggle Pill (Default is Family)
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (currentMode == ExpenseMode.FAMILY) {
                    Color(0xFF10B981).copy(alpha = 0.15f)
                } else {
                    PrimaryBlue.copy(alpha = 0.12f)
                },
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .clickable {
                        onModeToggle(
                            if (currentMode == ExpenseMode.INDIVIDUAL) ExpenseMode.FAMILY else ExpenseMode.INDIVIDUAL
                        )
                    }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = if (currentMode == ExpenseMode.FAMILY) Icons.Default.Groups else Icons.Default.Person,
                        contentDescription = null,
                        tint = if (currentMode == ExpenseMode.FAMILY) Color(0xFF10B981) else PrimaryBlue,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = if (currentMode == ExpenseMode.FAMILY) "Family" else "Solo",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (currentMode == ExpenseMode.FAMILY) Color(0xFF10B981) else PrimaryBlue
                    )
                }
            }

            // Theme Settings Button
            IconButton(
                onClick = onOpenThemeSettings,
                modifier = Modifier.size(34.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Palette,
                    contentDescription = "Theme Customizer",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Pin Lock Button
            IconButton(
                onClick = onLockSession,
                modifier = Modifier.size(34.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Lock Session",
                    tint = PrimaryBlue,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
