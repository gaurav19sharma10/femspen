package com.expensetracker.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue

data class CategoryFilterItem(
    val name: String,
    val color: Color
)

val DEFAULT_CATEGORIES = listOf(
    CategoryFilterItem("Food & Dining", Color(0xFFEF4444)),
    CategoryFilterItem("Transport", Color(0xFF3B82F6)),
    CategoryFilterItem("Bills & Utilities", Color(0xFFF59E0B)),
    CategoryFilterItem("Shopping", Color(0xFF8B5CF6)),
    CategoryFilterItem("Health & Fitness", Color(0xFF10B981)),
    CategoryFilterItem("Entertainment", Color(0xFFEC4899)),
    CategoryFilterItem("Home & Groceries", Color(0xFF14B8A6)),
    CategoryFilterItem("Others", Color(0xFF6B7280))
)

val KEEP_COLORS = listOf(
    Color(0xFFF8F7F4),
    Color(0xFFE3F2FD),
    Color(0xFFFFF0E0),
    Color(0xFFE8F5E9),
    Color(0xFFFCE4EC),
    Color(0xFFEDE7F6),
    Color(0xFFFFF9C4),
    Color(0xFFE0F2F1)
)

@Composable
fun FilterPills(
    selectedCategory: String?,
    onSelectCategory: (String?) -> Unit,
    selectedColor: String?,
    onSelectColor: (String?) -> Unit,
    onClearFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = LocalIsDarkTheme.current
    val hasFilter = selectedCategory != null || selectedColor != null

    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // "All" pill
        val isAllSelected = selectedCategory == null && selectedColor == null
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (isAllSelected) PrimaryBlue else MaterialTheme.colorScheme.surface,
            border = if (!isAllSelected) CardDefaults.outlinedCardBorder() else null,
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .clickable { onClearFilters() }
        ) {
            Text(
                text = "All",
                fontSize = 11.sp,
                fontWeight = if (isAllSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isAllSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }

        // Category pills
        DEFAULT_CATEGORIES.forEach { cat ->
            val isSelected = selectedCategory == cat.name
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = if (isSelected) {
                    if (isDark) Color(0xFF262626) else Color(0xFF111827)
                } else {
                    MaterialTheme.colorScheme.surface
                },
                border = if (!isSelected) CardDefaults.outlinedCardBorder() else null,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .clickable {
                        onSelectCategory(if (isSelected) null else cat.name)
                    }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(cat.color)
                    )
                    Text(
                        text = cat.name,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        // Divider
        Box(
            modifier = Modifier
                .height(18.dp)
                .width(1.dp)
                .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
        )

        // Palette icon
        Icon(
            imageVector = Icons.Default.Palette,
            contentDescription = "Color Filter",
            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
            modifier = Modifier.size(14.dp)
        )

        // Keep Color filter circles
        KEEP_COLORS.forEach { color ->
            val hex = "#%02X%02X%02X".format(
                (color.red * 255).toInt(),
                (color.green * 255).toInt(),
                (color.blue * 255).toInt()
            )
            val isColorSelected = selectedColor.equals(hex, ignoreCase = true)

            Box(
                modifier = Modifier
                    .size(20.dp)
                    .clip(CircleShape)
                    .background(color)
                    .border(
                        width = if (isColorSelected) 2.dp else 1.dp,
                        color = if (isColorSelected) PrimaryBlue else Color(0xFFCBD5E1),
                        shape = CircleShape
                    )
                    .clickable {
                        onSelectColor(if (isColorSelected) null else hex)
                    }
            )
        }

        // Clear filter button
        AnimatedVisibility(visible = hasFilter, enter = fadeIn(), exit = fadeOut()) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.error.copy(alpha = 0.12f),
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .clickable { onClearFilters() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Clear",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = "Clear",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
