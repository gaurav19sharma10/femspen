package com.expensetracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

val LocalIsDarkTheme = compositionLocalOf { false }

private fun interpolateColor(c1: Color, c2: Color, fraction: Float): Color {
    val f = fraction.coerceIn(0f, 1f)
    return Color(
        red = c1.red + (c2.red - c1.red) * f,
        green = c1.green + (c2.green - c1.green) * f,
        blue = c1.blue + (c2.blue - c1.blue) * f,
        alpha = c1.alpha + (c2.alpha - c1.alpha) * f
    )
}

fun calculateDarkColorScheme(sliderValue: Float): ColorScheme {
    val normalized = (sliderValue / 100f).coerceIn(0f, 1f)

    // Keyframes:
    // 0.0 -> AMOLED Pitch Black (#000000)
    // 0.5 -> Midnight Charcoal (#121212)
    // 1.0 -> Deep Slate Navy (#0B1120)

    val background = if (normalized <= 0.5f) {
        interpolateColor(Color(0xFF000000), Color(0xFF121212), normalized * 2f)
    } else {
        interpolateColor(Color(0xFF121212), Color(0xFF0B1120), (normalized - 0.5f) * 2f)
    }

    val surface = if (normalized <= 0.5f) {
        interpolateColor(Color(0xFF090909), Color(0xFF1E1E1E), normalized * 2f)
    } else {
        interpolateColor(Color(0xFF1E1E1E), Color(0xFF1E293B), (normalized - 0.5f) * 2f)
    }

    val surfaceVariant = if (normalized <= 0.5f) {
        interpolateColor(Color(0xFF141414), Color(0xFF282828), normalized * 2f)
    } else {
        interpolateColor(Color(0xFF282828), Color(0xFF334155), (normalized - 0.5f) * 2f)
    }

    val outline = if (normalized <= 0.5f) {
        interpolateColor(Color(0xFF222222), Color(0xFF333333), normalized * 2f)
    } else {
        interpolateColor(Color(0xFF333333), Color(0xFF475569), (normalized - 0.5f) * 2f)
    }

    val primary = if (normalized <= 0.5f) Color(0xFF3B82F6) else Color(0xFF38BDF8)

    return darkColorScheme(
        primary = primary,
        onPrimary = Color.White,
        primaryContainer = Color(0xFF1D4ED8),
        onPrimaryContainer = Color.White,
        background = background,
        onBackground = Color(0xFFF8FAFC),
        surface = surface,
        onSurface = Color(0xFFF8FAFC),
        surfaceVariant = surfaceVariant,
        onSurfaceVariant = Color(0xFF94A3B8),
        outline = outline
    )
}

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    onPrimary = Color.White,
    primaryContainer = PrimaryBlueLight,
    onPrimaryContainer = Color.White,
    background = BackgroundChalk,
    onBackground = TextPrimary,
    surface = SurfaceChalk,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariantChalk,
    onSurfaceVariant = TextSecondary,
    outline = Color(0xFFE2E8F0)
)

@Composable
fun ExpenseTrackerTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    darkIntensitySlider: Float = 60f,
    content: @Composable () -> Unit
) {
    val isSystemDark = isSystemInDarkTheme()
    val isDark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemDark
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val colorScheme = if (isDark) {
        calculateDarkColorScheme(darkIntensitySlider)
    } else {
        LightColorScheme
    }

    CompositionLocalProvider(LocalIsDarkTheme provides isDark) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
