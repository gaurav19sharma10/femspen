package com.expensetracker.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.ui.theme.BackgroundChalk
import com.expensetracker.ui.theme.PrimaryBlue
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException

@Composable
fun LoginScreen(
    onAuthSuccess: (userEmail: String, uid: String) -> Unit
) {
    var isSignUp by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val auth = remember { FirebaseAuth.getInstance() }

    fun handleAuth() {
        val cleanEmail = email.trim()
        if (cleanEmail.isBlank() || password.isBlank()) {
            errorMessage = "Please enter both email and password."
            return
        }

        if (password.length < 6) {
            errorMessage = "Password must be at least 6 characters."
            return
        }

        if (isSignUp && password != confirmPassword) {
            errorMessage = "Passwords do not match."
            return
        }

        isLoading = true
        errorMessage = null

        if (isSignUp) {
            auth.createUserWithEmailAndPassword(cleanEmail, password)
                .addOnSuccessListener { res ->
                    isLoading = false
                    val u = res.user
                    if (u != null) {
                        onAuthSuccess(u.email ?: cleanEmail, u.uid)
                    }
                }
                .addOnFailureListener { exc ->
                    isLoading = false
                    val msg = if (exc is FirebaseAuthException) {
                        when (exc.errorCode) {
                            "ERROR_EMAIL_ALREADY_IN_USE" -> "This email is already registered. Please sign in."
                            "ERROR_WEAK_PASSWORD" -> "Password is too weak. Must be 6+ characters."
                            "ERROR_INVALID_EMAIL" -> "Please enter a valid email address."
                            else -> exc.localizedMessage ?: "Sign up failed."
                        }
                    } else {
                        exc.localizedMessage ?: "Authentication failed."
                    }
                    errorMessage = msg
                }
        } else {
            auth.signInWithEmailAndPassword(cleanEmail, password)
                .addOnSuccessListener { res ->
                    isLoading = false
                    val u = res.user
                    if (u != null) {
                        onAuthSuccess(u.email ?: cleanEmail, u.uid)
                    }
                }
                .addOnFailureListener { exc ->
                    isLoading = false
                    val msg = if (exc is FirebaseAuthException) {
                        when (exc.errorCode) {
                            "ERROR_WRONG_PASSWORD", "ERROR_USER_NOT_FOUND", "ERROR_INVALID_CREDENTIAL" ->
                                "Invalid email or password. Please verify your credentials."
                            "ERROR_TOO_MANY_REQUESTS" ->
                                "Too many attempts. Please try again in a few minutes."
                            else -> exc.localizedMessage ?: "Sign in failed."
                        }
                    } else {
                        exc.localizedMessage ?: "Authentication failed."
                    }
                    errorMessage = msg
                }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundChalk)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // FemSpen Emblem
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = PrimaryBlue,
                    modifier = Modifier.size(60.dp),
                    shadowElevation = 6.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = "F",
                            color = Color.White,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "FemSpen",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF0F172A)
                )

                Text(
                    text = "Real-time personal & family expense tracking",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Toggle tabs
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF1F5F9), RoundedCornerShape(14.dp))
                        .padding(4.dp)
                ) {
                    Button(
                        onClick = {
                            isSignUp = false
                            errorMessage = null
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (!isSignUp) Color.White else Color.Transparent,
                            contentColor = if (!isSignUp) Color(0xFF0F172A) else Color(0xFF64748B)
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f),
                        elevation = if (!isSignUp) ButtonDefaults.buttonElevation(defaultElevation = 2.dp) else null
                    ) {
                        Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            isSignUp = true
                            errorMessage = null
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isSignUp) Color.White else Color.Transparent,
                            contentColor = if (isSignUp) Color(0xFF0F172A) else Color(0xFF64748B)
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f),
                        elevation = if (isSignUp) ButtonDefaults.buttonElevation(defaultElevation = 2.dp) else null
                    ) {
                        Text("Register", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Email field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFF94A3B8)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Password field
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF94A3B8)) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                if (isSignUp) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = { Text("Confirm Password") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF94A3B8)) },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                errorMessage?.let { msg ->
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = msg,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Primary Button
                Button(
                    onClick = { handleAuth() },
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Text(
                            text = if (isSignUp) "Register & Continue" else "Sign In",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
