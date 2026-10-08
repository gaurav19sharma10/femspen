package com.expensetracker.ui.editor

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.ui.theme.PrimaryBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseEditorSheet(
    initialExpense: Expense?,
    currentMode: ExpenseMode,
    onDismiss: () -> Unit,
    onSave: (Expense) -> Unit,
    onDelete: (String) -> Unit
) {
    var title by remember { mutableStateOf(initialExpense?.title ?: "") }
    var amount by remember { mutableStateOf(initialExpense?.amount?.toString() ?: "") }
    var category by remember { mutableStateOf(initialExpense?.category ?: "Food") }
    var selectedColor by remember { mutableStateOf(initialExpense?.color ?: "#F8F7F4") }
    var notes by remember { mutableStateOf(initialExpense?.notes ?: "") }
    var isRecurring by remember { mutableStateOf(initialExpense?.isRecurring ?: false) }
    var familyMember by remember { mutableStateOf(initialExpense?.familyMember ?: "Dad") }

    val keepColors = listOf(
        "#F8F7F4", "#FFE0B2", "#C8E6C9", "#BBDEFB", "#FFF9C4", "#E1BEE7", "#FFCDD2", "#DCEDC8"
    )

    val categories = listOf("Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Education", "Home")

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .navigationBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (initialExpense == null) "New Expense Note" else "Edit Expense",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                if (initialExpense != null) {
                    IconButton(onClick = { onDelete(initialExpense.id) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFEF4444))
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Title input
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Expense Title") },
                placeholder = { Text("e.g. Starbucks Latte, Metro Pass") },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Amount input
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Amount ($)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Keep Color Palette Row
            Text(text = "Card Tint Color", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF64748B))
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                keepColors.forEach { hex ->
                    val colorObj = Color(android.graphics.Color.parseColor(hex))
                    val isSelected = selectedColor.equals(hex, ignoreCase = true)
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(colorObj)
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) PrimaryBlue else Color.LightGray,
                                shape = CircleShape
                            )
                            .clickable { selectedColor = hex },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSelected) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Notes input
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes / Checklist") },
                maxLines = 3,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Save Button
            Button(
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull() ?: 0.0
                    val exp = (initialExpense ?: Expense()).copy(
                        title = title.ifBlank { "Untitled Expense" },
                        amount = parsedAmount,
                        category = category,
                        color = selectedColor,
                        notes = notes,
                        mode = currentMode.name,
                        familyMember = if (currentMode == ExpenseMode.FAMILY) familyMember else null,
                        isRecurring = isRecurring,
                        date = java.time.LocalDate.now().toString()
                    )
                    onSave(exp)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text("Save Expense Card", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}
