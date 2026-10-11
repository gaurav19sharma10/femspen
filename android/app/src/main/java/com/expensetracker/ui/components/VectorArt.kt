package com.expensetracker.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.graphics.PathParser
import com.expensetracker.ui.theme.PrimaryBlue

/**
 * Helper to parse SVG path data string to Compose Path
 */
private fun svgPath(d: String): Path {
    val androidPath = PathParser.createPathFromPathData(d)
    return androidPath.asComposePath()
}

/**
 * 1. Official FemSpen Geometric Shield & Financial Growth Mark
 */
@Composable
fun FemSpenLogo(
    modifier: Modifier = Modifier,
    size: Dp = 64.dp
) {
    val shieldPath = remember { svgPath("M50 8L86 26V58C86 75 70 90 50 96C30 90 14 75 14 58V26L50 8Z") }
    val innerShield = remember { svgPath("M50 16L78 30V56C78 69 66 81 50 86C34 81 22 69 22 56V30L50 16Z") }
    val arrowPath = remember { svgPath("M66 28L75 28L75 37") }

    Canvas(modifier = modifier.size(size)) {
        val scaleFactor = this.size.width / 100f
        scale(scaleFactor, scaleFactor, pivot = Offset.Zero) {
            // Shield Base
            drawPath(
                path = shieldPath,
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF2563EB), Color(0xFF0057FF)),
                    start = Offset(0f, 0f),
                    end = Offset(100f, 100f)
                )
            )

            // Inner Depth
            drawPath(
                path = innerShield,
                color = Color(0xFF0046D1).copy(alpha = 0.4f)
            )

            // Stylized "F" Stem
            drawRoundRect(
                color = Color.White,
                topLeft = Offset(36f, 32f),
                size = Size(8f, 38f),
                cornerRadius = CornerRadius(4f, 4f)
            )

            // Top Bar
            drawRoundRect(
                color = Color.White,
                topLeft = Offset(40f, 32f),
                size = Size(26f, 8f),
                cornerRadius = CornerRadius(4f, 4f)
            )

            // Middle Bar
            drawRoundRect(
                color = Color.White.copy(alpha = 0.9f),
                topLeft = Offset(44f, 47f),
                size = Size(16f, 6f),
                cornerRadius = CornerRadius(3f, 3f)
            )

            // Growth Arrowhead & Circle
            drawCircle(
                color = Color(0xFF93C5FD),
                radius = 4.5f,
                center = Offset(70f, 36f)
            )

            drawPath(
                path = arrowPath,
                color = Color.White,
                style = Stroke(width = 2.5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
            )
        }
    }
}

/**
 * 2. Handcrafted 2FA Security Vault Vector Art
 */
@Composable
fun FemSpenVaultArt(
    modifier: Modifier = Modifier,
    size: Dp = 150.dp
) {
    val crestPath = remember { svgPath("M100 24L118 33V44C118 55 110 64 100 68C90 64 82 55 82 44V33L100 24Z") }
    val checkPath = remember { svgPath("M94 45L98 49L106 41") }
    val sparkle1 = remember { svgPath("M156 46L158 52L164 54L158 56L156 62L154 56L148 54L154 52L156 46Z") }
    val sparkle2 = remember { svgPath("M42 142L43.5 146.5L48 148L43.5 149.5L42 154L40.5 149.5L36 148L40.5 146.5L42 142Z") }

    Canvas(modifier = modifier.size(size)) {
        val s = this.size.width / 200f
        scale(s, s, pivot = Offset.Zero) {
            // Ambient Glow Aura
            drawCircle(color = PrimaryBlue.copy(alpha = 0.08f), radius = 88f, center = Offset(100f, 100f))
            drawCircle(
                color = Color(0xFFE2E8F0),
                radius = 72f,
                center = Offset(100f, 100f),
                style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f)))
            )

            // Heavy Vault Body
            drawRoundRect(
                brush = Brush.linearGradient(listOf(Color.White, Color(0xFFF1F5F9))),
                topLeft = Offset(48f, 48f),
                size = Size(104f, 104f),
                cornerRadius = CornerRadius(30f, 30f)
            )
            drawRoundRect(
                color = PrimaryBlue,
                topLeft = Offset(48f, 48f),
                size = Size(104f, 104f),
                cornerRadius = CornerRadius(30f, 30f),
                style = Stroke(width = 3.5f)
            )

            // Inner Plate
            drawRoundRect(
                color = Color(0xFFF8F7F4),
                topLeft = Offset(56f, 56f),
                size = Size(88f, 88f),
                cornerRadius = CornerRadius(22f, 22f)
            )
            drawRoundRect(
                color = Color(0xFFCBD5E1),
                topLeft = Offset(56f, 56f),
                size = Size(88f, 88f),
                cornerRadius = CornerRadius(22f, 22f),
                style = Stroke(width = 1.5f)
            )

            // Corner Bolting
            listOf(Offset(64f, 64f), Offset(136f, 64f), Offset(64f, 136f), Offset(136f, 136f)).forEach {
                drawCircle(color = Color(0xFF94A3B8), radius = 3f, center = it)
            }

            // 4-PIN Status LED Indicators
            listOf(79f, 93f, 107f, 121f).forEach { x ->
                drawCircle(color = PrimaryBlue, radius = 4f, center = Offset(x, 76f))
            }

            // Central Rotary Vault Dial
            drawCircle(color = PrimaryBlue.copy(alpha = 0.12f), radius = 28f, center = Offset(100f, 108f))
            drawCircle(
                brush = Brush.linearGradient(listOf(Color(0xFF2563EB), Color(0xFF0057FF))),
                radius = 22f,
                center = Offset(100f, 108f)
            )
            drawCircle(color = Color.White, radius = 22f, center = Offset(100f, 108f), style = Stroke(width = 2f))
            drawCircle(color = Color.White, radius = 9f, center = Offset(100f, 108f))
            drawCircle(color = PrimaryBlue, radius = 4f, center = Offset(100f, 108f))

            // Dial Precision Ticks
            drawLine(Color.White, Offset(100f, 88f), Offset(100f, 92f), strokeWidth = 2f, cap = StrokeCap.Round)
            drawLine(Color.White, Offset(120f, 108f), Offset(116f, 108f), strokeWidth = 2f, cap = StrokeCap.Round)
            drawLine(Color.White, Offset(100f, 128f), Offset(100f, 124f), strokeWidth = 2f, cap = StrokeCap.Round)
            drawLine(Color.White, Offset(80f, 108f), Offset(84f, 108f), strokeWidth = 2f, cap = StrokeCap.Round)

            // Top Crest
            drawPath(crestPath, PrimaryBlue)
            drawPath(checkPath, Color.White, style = Stroke(width = 2.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))

            // Sparkles
            drawPath(sparkle1, PrimaryBlue.copy(alpha = 0.8f))
            drawPath(sparkle2, PrimaryBlue.copy(alpha = 0.5f))
        }
    }
}

/**
 * 3. Handcrafted Google Keep-style Empty Ledger Vector Art
 */
@Composable
fun FemSpenEmptyFeedArt(
    modifier: Modifier = Modifier,
    size: Dp = 160.dp
) {
    Canvas(modifier = modifier.size(size)) {
        val s = this.size.width / 200f
        scale(s, s, pivot = Offset.Zero) {
            // Shadow
            drawOval(
                color = Color(0xFFE2E8F0).copy(alpha = 0.6f),
                topLeft = Offset(28f, 158f),
                size = Size(144f, 24f)
            )

            // Tilted Note Card 1 (Sky Blue)
            rotate(-6f, pivot = Offset(85f, 95f)) {
                drawRoundRect(Color(0xFFE3F2FD), Offset(42f, 45f), Size(84f, 100f), CornerRadius(16f, 16f))
                drawRoundRect(Color(0xFF90CAF9), Offset(42f, 45f), Size(84f, 100f), CornerRadius(16f, 16f), style = Stroke(2f))
                drawRoundRect(Color(0xFF1E88E5).copy(alpha = 0.5f), Offset(54f, 60f), Size(46f, 6f), CornerRadius(3f, 3f))
                drawRoundRect(Color(0xFF1E88E5).copy(alpha = 0.25f), Offset(54f, 74f), Size(60f, 4f), CornerRadius(2f, 2f))
                drawRoundRect(Color(0xFF1E88E5).copy(alpha = 0.25f), Offset(54f, 84f), Size(50f, 4f), CornerRadius(2f, 2f))
            }

            // Tilted Note Card 2 (Soft Peach)
            rotate(7f, pivot = Offset(120f, 100f)) {
                drawRoundRect(Color(0xFFFFF0E0), Offset(80f, 52f), Size(84f, 100f), CornerRadius(16f, 16f))
                drawRoundRect(Color(0xFFFFCC80), Offset(80f, 52f), Size(84f, 100f), CornerRadius(16f, 16f), style = Stroke(2f))
                drawRoundRect(Color(0xFFFB8C00).copy(alpha = 0.5f), Offset(92f, 66f), Size(38f, 6f), CornerRadius(3f, 3f))
                drawRoundRect(Color(0xFFFB8C00).copy(alpha = 0.25f), Offset(92f, 80f), Size(60f, 4f), CornerRadius(2f, 2f))
            }

            // Foreground White Card with Pushpin
            drawRoundRect(Color.White, Offset(70f, 60f), Size(86f, 102f), CornerRadius(18f, 18f))
            drawRoundRect(PrimaryBlue, Offset(70f, 60f), Size(86f, 102f), CornerRadius(18f, 18f), style = Stroke(2.5f))
            drawRoundRect(PrimaryBlue, Offset(83f, 76f), Size(36f, 6f), CornerRadius(3f, 3f))
            drawRoundRect(Color(0xFFCBD5E1), Offset(83f, 90f), Size(58f, 4f), CornerRadius(2f, 2f))
            drawRoundRect(Color(0xFFCBD5E1), Offset(83f, 100f), Size(44f, 4f), CornerRadius(2f, 2f))

            // Pushpin
            drawCircle(PrimaryBlue, radius = 5f, center = Offset(141f, 74f))
            drawLine(PrimaryBlue, Offset(141f, 74f), Offset(147f, 68f), strokeWidth = 2.5f, cap = StrokeCap.Round)

            // Floating Golden Coin
            drawCircle(Color(0xFFFEF3C7), radius = 18f, center = Offset(156f, 46f))
            drawCircle(Color(0xFFF59E0B), radius = 18f, center = Offset(156f, 46f), style = Stroke(2.5f))
            drawCircle(Color(0xFFFDE68A), radius = 13f, center = Offset(156f, 46f))
        }
    }
}

/**
 * 4. Handcrafted Family Collaborative Vector Art
 */
@Composable
fun FemSpenFamilyArt(
    modifier: Modifier = Modifier,
    size: Dp = 150.dp
) {
    val housePath = remember { svgPath("M100 42L44 88V152C44 157.5 48.5 162 54 162H146C151.5 162 156 157.5 156 152V88L100 42Z") }
    val roofPath = remember { svgPath("M38 92L100 40L162 92") }
    val heartPath = remember { svgPath("M100 79L95.5 74.5C93 72 93 68.5 95.5 66.5C97.5 64.5 100 65.5 100 66.5C100 65.5 102.5 64.5 104.5 66.5C107 68.5 107 72 104.5 74.5L100 79Z") }

    Canvas(modifier = modifier.size(size)) {
        val s = this.size.width / 200f
        scale(s, s, pivot = Offset.Zero) {
            drawCircle(Color(0xFF10B981).copy(alpha = 0.1f), radius = 78f, center = Offset(100f, 100f))

            // House Base
            drawPath(housePath, Color.White)
            drawPath(housePath, PrimaryBlue, style = Stroke(3f))
            drawPath(roofPath, PrimaryBlue, style = Stroke(3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))

            // Member 1 (Left)
            drawCircle(Color(0xFFE3F2FD), radius = 13f, center = Offset(75f, 116f))
            drawCircle(PrimaryBlue, radius = 13f, center = Offset(75f, 116f), style = Stroke(2f))
            drawCircle(PrimaryBlue, radius = 5.5f, center = Offset(75f, 112f))

            // Member 2 (Right)
            drawCircle(Color(0xFFFEF3C7), radius = 13f, center = Offset(125f, 116f))
            drawCircle(Color(0xFFF59E0B), radius = 13f, center = Offset(125f, 116f), style = Stroke(2f))
            drawCircle(Color(0xFFD97706), radius = 5.5f, center = Offset(125f, 112f))

            // Member 3 (Center)
            drawCircle(Color(0xFFE8F5E9), radius = 10f, center = Offset(100f, 130f))
            drawCircle(Color(0xFF10B981), radius = 10f, center = Offset(100f, 130f), style = Stroke(2f))
            drawCircle(Color(0xFF059669), radius = 4f, center = Offset(100f, 127f))

            // Heart Crest
            drawCircle(PrimaryBlue, radius = 15f, center = Offset(100f, 72f))
            drawPath(heartPath, Color.White)
        }
    }
}

/**
 * 5. Handcrafted Spend Analytics Vector Art
 */
@Composable
fun FemSpenAnalyticsArt(
    modifier: Modifier = Modifier,
    size: Dp = 140.dp
) {
    val splinePath = remember { svgPath("M44 88Q72 50 94 40T122 70") }

    Canvas(modifier = modifier.size(size)) {
        val s = this.size.width / 160f
        scale(s, s, pivot = Offset.Zero) {
            drawCircle(Color(0xFFEFF6FF), radius = 64f, center = Offset(80f, 80f))
            drawCircle(Color(0xFFDBEAFE), radius = 64f, center = Offset(80f, 80f), style = Stroke(1.5f))

            // Bars
            drawRoundRect(Color(0xFF93C5FD), Offset(42f, 90f), Size(16f, 35f), CornerRadius(6f, 6f))
            drawRoundRect(Color(0xFF3B82F6), Offset(64f, 65f), Size(16f, 60f), CornerRadius(6f, 6f))
            drawRoundRect(Color(0xFF0057FF), Offset(86f, 44f), Size(16f, 81f), CornerRadius(6f, 6f))
            drawRoundRect(Color(0xFF60A5FA), Offset(108f, 75f), Size(16f, 50f), CornerRadius(6f, 6f))

            // Spline Trend
            drawPath(splinePath, Color(0xFF1E40AF), style = Stroke(3f, cap = StrokeCap.Round))
            drawCircle(Color.White, radius = 4.5f, center = Offset(94f, 40f))
            drawCircle(PrimaryBlue, radius = 4.5f, center = Offset(94f, 40f), style = Stroke(3f))
        }
    }
}

/**
 * 6. Handcrafted Recurring Bills Piggybank Vector Art
 */
@Composable
fun FemSpenRecurringArt(
    modifier: Modifier = Modifier,
    size: Dp = 140.dp
) {
    Canvas(modifier = modifier.size(size)) {
        val s = this.size.width / 160f
        scale(s, s, pivot = Offset.Zero) {
            drawCircle(Color(0xFFECFDF5), radius = 65f, center = Offset(80f, 80f))
            drawCircle(Color(0xFFA7F3D0), radius = 65f, center = Offset(80f, 80f), style = Stroke(1.5f))

            // Piggy Body
            drawOval(Color.White, Offset(38f, 53f), Size(84f, 64f))
            drawOval(Color(0xFF10B981), Offset(38f, 53f), Size(84f, 64f), style = Stroke(3f))

            // Snout
            drawOval(Color(0xFFE8F5E9), Offset(36f, 77f), Size(16f, 22f))
            drawOval(Color(0xFF10B981), Offset(36f, 77f), Size(16f, 22f), style = Stroke(2.5f))
            drawCircle(Color(0xFF059669), radius = 2f, center = Offset(43f, 85f))
            drawCircle(Color(0xFF059669), radius = 2f, center = Offset(43f, 91f))

            // Legs
            drawRoundRect(Color(0xFF10B981), Offset(58f, 112f), Size(9f, 12f), CornerRadius(4f, 4f))
            drawRoundRect(Color(0xFF10B981), Offset(94f, 112f), Size(9f, 12f), CornerRadius(4f, 4f))

            // Eye
            drawCircle(Color(0xFF10B981), radius = 3f, center = Offset(62f, 74f))

            // Coin Slot & Falling Gold Coin
            drawLine(Color(0xFF059669), Offset(74f, 58f), Offset(90f, 58f), strokeWidth = 3.5f, cap = StrokeCap.Round)
            drawCircle(Color(0xFFFCD34D), radius = 11f, center = Offset(82f, 44f))
            drawCircle(Color(0xFFD97706), radius = 11f, center = Offset(82f, 44f), style = Stroke(2f))

            // Cycle Badge
            drawCircle(PrimaryBlue, radius = 14f, center = Offset(120f, 65f))
        }
    }
}
