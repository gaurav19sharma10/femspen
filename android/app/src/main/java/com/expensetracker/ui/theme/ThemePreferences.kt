package com.expensetracker.ui.theme

import android.content.Context
import android.content.SharedPreferences

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK
}

enum class DarkModeIntensity(val title: String, val subtitle: String) {
    PITCH_BLACK("AMOLED Pitch Black", "Pure #000000 true black for OLED battery efficiency"),
    MIDNIGHT_CHARCOAL("Midnight Charcoal", "Balanced #121212 dark mode with subtle contrast"),
    DEEP_SLATE("Deep Slate Navy", "Rich modern #0F172A slate with deep blue undertones")
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

    var darkIntensity: DarkModeIntensity
        get() {
            val name = prefs.getString("dark_intensity", DarkModeIntensity.DEEP_SLATE.name)
            return try {
                DarkModeIntensity.valueOf(name ?: DarkModeIntensity.DEEP_SLATE.name)
            } catch (e: Exception) {
                DarkModeIntensity.DEEP_SLATE
            }
        }
        set(value) {
            prefs.edit().putString("dark_intensity", value.name).apply()
        }
}
