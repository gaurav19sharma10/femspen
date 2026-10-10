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

private val PitchBlackColorScheme = darkColorScheme(
    primary = Color(0xFF3B82F6),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF1D4ED8),
    onPrimaryContainer = Color.White,
    background = BackgroundPitchBlack,
    onBackground = Color(0xFFF8FAFC),
    surface = SurfacePitchBlack,
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = SurfaceVariantPitchBlack,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF262626)
)

private val MidnightCharcoalColorScheme = darkColorScheme(
    primary = Color(0xFF3B82F6),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF1E3A8A),
    onPrimaryContainer = Color.White,
    background = BackgroundMidnight,
    onBackground = Color(0xFFF8FAFC),
    surface = SurfaceMidnight,
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = SurfaceVariantMidnight,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF333333)
)

private val DeepSlateColorScheme = darkColorScheme(
    primary = Color(0xFF38BDF8),
    onPrimary = Color(0xFF0F172A),
    primaryContainer = Color(0xFF0369A1),
    onPrimaryContainer = Color.White,
    background = BackgroundDeepSlate,
    onBackground = Color(0xFFF8FAFC),
    surface = SurfaceDeepSlate,
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = SurfaceVariantDeepSlate,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF334155)
)

@Composable
fun ExpenseTrackerTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    darkIntensity: DarkModeIntensity = DarkModeIntensity.DEEP_SLATE,
    content: @Composable () -> Unit
) {
    val isSystemDark = isSystemInDarkTheme()
    val isDark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemDark
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val colorScheme: ColorScheme = if (isDark) {
        when (darkIntensity) {
            DarkModeIntensity.PITCH_BLACK -> PitchBlackColorScheme
            DarkModeIntensity.MIDNIGHT_CHARCOAL -> MidnightCharcoalColorScheme
            DarkModeIntensity.DEEP_SLATE -> DeepSlateColorScheme
        }
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
