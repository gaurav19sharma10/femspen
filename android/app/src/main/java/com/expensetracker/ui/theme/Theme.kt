package com.expensetracker.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    onPrimary = SurfaceChalk,
    primaryContainer = PrimaryBlueLight,
    onPrimaryContainer = SurfaceChalk,
    background = BackgroundChalk,
    onBackground = TextPrimary,
    surface = SurfaceChalk,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariantChalk,
    onSurfaceVariant = TextSecondary
)

@Composable
fun ExpenseTrackerTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
