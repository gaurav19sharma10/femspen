package com.expensetracker.utils

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.core.content.FileProvider
import com.expensetracker.data.model.Expense
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

object ExportUtils {
    fun exportExpensesToCSV(
        context: Context,
        expenses: List<Expense>,
        modeName: String = "All"
    ) {
        if (expenses.isEmpty()) {
            Toast.makeText(context, "No expenses to export", Toast.LENGTH_SHORT).show()
            return
        }

        try {
            val headers = listOf("ID", "Title", "Amount", "Currency", "Category", "Mode", "Date", "Family Member", "Recurring", "Notes")
            val rows = expenses.map { e ->
                listOf(
                    "\"${e.id}\"",
                    "\"${(e.title).replace("\"", "\"\"")}\"",
                    "%.2f".format(Locale.US, e.amount),
                    "\"INR\"",
                    "\"${e.category}\"",
                    "\"${e.mode}\"",
                    "\"${e.date}\"",
                    "\"${(e.familyMember ?: "").replace("\"", "\"\"")}\"",
                    if (e.isRecurring) "Yes" else "No",
                    "\"${(e.notes).replace("\"", "\"\"")}\""
                ).joinToString(",")
            }

            val csvContent = (listOf(headers.joinToString(",")) + rows).joinToString("\n")

            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val fileName = "femspen_${modeName.lowercase()}_$timeStamp.csv"

            val cacheFile = File(context.cacheDir, fileName)
            cacheFile.writeText(csvContent, Charsets.UTF_8)

            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                cacheFile
            )

            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/csv"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "FemSpen Expense Export ($modeName)")
                putExtra(Intent.EXTRA_TEXT, "Export of ${expenses.size} expenses from FemSpen.")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(sendIntent, "Export Expenses CSV")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            // Fallback to text share
            try {
                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, "FemSpen Expense Export")
                    putExtra(Intent.EXTRA_TEXT, expenses.joinToString("\n") { "${it.date} - ${it.title}: ₹${it.amount} (${it.category})" })
                }
                val chooser = Intent.createChooser(sendIntent, "Export Expenses")
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)
            } catch (err: Exception) {
                Toast.makeText(context, "Export failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
