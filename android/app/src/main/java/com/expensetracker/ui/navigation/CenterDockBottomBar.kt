package com.expensetracker.ui.navigation

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue

enum class BottomNavTab {
    FEED,
    WALLET,
    GOALS,
    SETTINGS
}

@Composable
fun CenterDockBottomBar(
    currentTab: BottomNavTab,
    onTabSelected: (BottomNavTab) -> Unit,
    onAddExpenseClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = LocalIsDarkTheme.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Ultra smooth spring physics scale & micro rotation animation starting from the button
    val fabScale by animateFloatAsState(
        targetValue = if (isPressed) 0.85f else 1f,
        animationSpec = spring(dampingRatio = 0.45f, stiffness = Spring.StiffnessMediumLow),
        label = "fabScaleAnim"
    )

    val fabRotation by animateFloatAsState(
        targetValue = if (isPressed) 45f else 0f,
        animationSpec = spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessMedium),
        label = "fabRotation"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(90.dp)
            .padding(horizontal = 14.dp, vertical = 6.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Modern Floating Pill Navigation Bar
        Surface(
            shape = RoundedCornerShape(28.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 3.dp,
            shadowElevation = if (isDark) 0.dp else 10.dp,
            border = if (isDark) CardDefaults.outlinedCardBorder() else null,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left 2 items (Feed & Wallet)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    NavItem(
                        title = "Expenses",
                        icon = Icons.Default.ViewAgenda,
                        isSelected = currentTab == BottomNavTab.FEED,
                        onClick = { onTabSelected(BottomNavTab.FEED) },
                        modifier = Modifier.weight(1f)
                    )
                    NavItem(
                        title = "Wallet",
                        icon = Icons.Default.AccountBalanceWallet,
                        isSelected = currentTab == BottomNavTab.WALLET,
                        onClick = { onTabSelected(BottomNavTab.WALLET) },
                        modifier = Modifier.weight(1f)
                    )
                }

                // Center space for docked button
                Spacer(modifier = Modifier.width(66.dp))

                // Right 2 items (Goals & Settings)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    NavItem(
                        title = "Goals",
                        icon = Icons.Default.Flag,
                        isSelected = currentTab == BottomNavTab.GOALS,
                        onClick = { onTabSelected(BottomNavTab.GOALS) },
                        modifier = Modifier.weight(1f)
                    )
                    NavItem(
                        title = "Settings",
                        icon = Icons.Default.Settings,
                        isSelected = currentTab == BottomNavTab.SETTINGS,
                        onClick = { onTabSelected(BottomNavTab.SETTINGS) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Prominent Center Add Expense Button docked in the navigation bar with spring bounce
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-6).dp)
                .scale(fabScale)
                .rotate(fabRotation)
                .size(56.dp)
                .shadow(elevation = 12.dp, shape = CircleShape)
                .clip(CircleShape)
                .background(
                    Brush.verticalGradient(
                        listOf(PrimaryBlue, Color(0xFF1D4ED8))
                    )
                )
                .border(2.5.dp, MaterialTheme.colorScheme.surface, CircleShape)
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    onClick = onAddExpenseClick
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Add Expense",
                tint = Color.White,
                modifier = Modifier.size(30.dp)
            )
        }
    }
}

@Composable
private fun NavItem(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = if (isSelected) PrimaryBlue else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
            modifier = Modifier.size(21.dp)
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = title,
            fontSize = 10.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) PrimaryBlue else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
        )
    }
}
