package com.expensetracker.data.repository

import com.expensetracker.data.model.Expense
import com.expensetracker.data.model.ExpenseMode
import com.expensetracker.data.model.UserProfile
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class ExpenseRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private val currentUserId: String?
        get() = auth.currentUser?.uid

    /**
     * Real-time stream of expenses for the currently authenticated user filtered by mode.
     */
    fun getExpensesFlow(mode: ExpenseMode): Flow<List<Expense>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val registration = firestore.collection("users")
            .document(uid)
            .collection("expenses")
            .whereEqualTo("mode", mode.name)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val items = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Expense::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(items)
            }

        awaitClose { registration.remove() }
    }

    suspend fun saveExpense(expense: Expense): String {
        val uid = currentUserId ?: throw IllegalStateException("User not logged in")
        val collection = firestore.collection("users").document(uid).collection("expenses")

        return if (expense.id.isBlank()) {
            val docRef = collection.add(expense).await()
            docRef.id
        } else {
            collection.document(expense.id).set(expense).await()
            expense.id
        }
    }

    suspend fun deleteExpense(expenseId: String) {
        val uid = currentUserId ?: throw IllegalStateException("User not logged in")
        firestore.collection("users")
            .document(uid)
            .collection("expenses")
            .document(expenseId)
            .delete()
            .await()
    }

    suspend fun getUserProfile(): UserProfile? {
        val uid = currentUserId ?: return null
        val doc = firestore.collection("users").document(uid).get().await()
        return doc.toObject(UserProfile::class.java)
    }

    suspend fun saveUserProfile(profile: UserProfile) {
        val uid = currentUserId ?: throw IllegalStateException("User not logged in")
        firestore.collection("users").document(uid).set(profile).await()
    }
}
