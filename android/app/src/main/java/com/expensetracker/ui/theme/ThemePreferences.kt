package com.expensetracker.ui.theme

import android.content.Context
import android.content.SharedPreferences

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK
}

enum class DarkModeIntensity(val title: String, val subtitle: String, val sliderValue: Float) {
    PITCH_BLACK("AMOLED Pitch Black", "Pure #000000 true black for OLED battery efficiency", 0f),
    MIDNIGHT_CHARCOAL("Midnight Charcoal", "Balanced #121212 dark mode with subtle contrast", 50f),
    DEEP_SLATE("Deep Slate Navy", "Rich modern #0F172A slate with deep blue undertones", 100f)
}

class ThemePreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("femspen_theme_prefs", Context.MODE_PRIVATE)

    var themeMode: ThemeMode
        get() {
            val name = prefs.getString("theme_mode", ThemeMode.SYSTEM.name)
            return try {
                ThemeMode.valueOf(name ?: ThemeMode.SYSTEM.name)
            } catch (e: Exception) {
                ThemeMode.SYSTEM
            }
        }
        set(value) {
            prefs.edit().putString("theme_mode", value.name).apply()
        }

    /**
     * Slider value representing dark mode intensity from 0.0f (Pitch Black OLED) to 100.0f (Deep Slate Navy).
     */
    var darkIntensitySlider: Float
        get() = prefs.getFloat("dark_intensity_slider", 60f)
        set(value) {
            prefs.edit().putFloat("dark_intensity_slider", value.coerceIn(0f, 100f)).apply()
        }

    var darkIntensity: DarkModeIntensity
        get() {
            val slider = darkIntensitySlider
            return when {
                slider <= 25f -> DarkModeIntensity.PITCH_BLACK
                slider <= 70f -> DarkModeIntensity.MIDNIGHT_CHARCOAL
                else -> DarkModeIntensity.DEEP_SLATE
            }
        }
        set(value) {
            darkIntensitySlider = value.sliderValue
            prefs.edit().putString("dark_intensity", value.name).apply()
        }
}
