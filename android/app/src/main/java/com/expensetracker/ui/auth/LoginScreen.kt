package com.expensetracker.ui.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.expensetracker.ui.theme.LocalIsDarkTheme
import com.expensetracker.ui.theme.PrimaryBlue
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

@Composable
fun LoginScreen(
    onAuthSuccess: (userEmail: String, uid: String) -> Unit
) {
    var isSignUp by remember { mutableStateOf(false) }
    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val isDark = LocalIsDarkTheme.current
    val auth = remember { FirebaseAuth.getInstance() }
    val db = remember { FirebaseFirestore.getInstance() }

    fun handleAuth() {
        val cleanEmail = email.trim()
        val cleanPassword = password.trim()
        val cleanName = displayName.trim()

        if (cleanEmail.isBlank() || cleanPassword.isBlank()) {
            errorMessage = "Please enter your email and password."
            return
        }

        if (cleanPassword.length < 6) {
            errorMessage = "Password must be at least 6 characters long."
            return
        }

        if (isSignUp) {
            if (cleanName.isBlank()) {
                errorMessage = "Please enter your full name."
                return
            }
            if (cleanPassword != confirmPassword.trim()) {
                errorMessage = "Passwords do not match. Please recheck."
                return
            }
        }

        isLoading = true
        errorMessage = null

        if (isSignUp) {
            auth.createUserWithEmailAndPassword(cleanEmail, cleanPassword)
                .addOnSuccessListener { res ->
                    val user = res.user
                    if (user != null) {
                        // Save full name and initial profile to Firestore immediately
                        val profileData = hashMapOf(
                            "uid" to user.uid,
                            "email" to cleanEmail,
                            "displayName" to cleanName,
                            "currency" to "INR",
                            "createdAt" to FieldValue.serverTimestamp()
                        )
                        db.collection("users").document(user.uid).set(profileData)
                            .addOnCompleteListener {
                                // Initialize wallet with default starting balance
                                val walletData = hashMapOf(
                                    "balance" to 25000.0,
                                    "currency" to "INR",
                                    "ownerUserId" to user.uid,
                                    "updatedAt" to FieldValue.serverTimestamp()
                                )
                                db.collection("users").document(user.uid)
                                    .collection("wallet").document("main")
                                    .set(walletData)

                                isLoading = false
                                onAuthSuccess(user.email ?: cleanEmail, user.uid)
                            }
                    } else {
                        isLoading = false
                    }
                }
                .addOnFailureListener { exc ->
                    isLoading = false
                    errorMessage = if (exc is FirebaseAuthException) {
                        when (exc.errorCode) {
                            "ERROR_EMAIL_ALREADY_IN_USE" -> "This email is already registered. Please sign in."
                            "ERROR_WEAK_PASSWORD" -> "Password is too weak. Must be 6+ characters."
                            "ERROR_INVALID_EMAIL" -> "Please enter a valid email address."
                            else -> exc.localizedMessage ?: "Sign up failed."
                        }
                    } else {
                        exc.localizedMessage ?: "Sign up failed."
                    }
                }
        } else {
            auth.signInWithEmailAndPassword(cleanEmail, cleanPassword)
                .addOnSuccessListener { res ->
                    isLoading = false
                    val user = res.user
                    if (user != null) {
                        onAuthSuccess(user.email ?: cleanEmail, user.uid)
                    }
                }
                .addOnFailureListener { exc ->
                    isLoading = false
                    errorMessage = if (exc is FirebaseAuthException) {
                        when (exc.errorCode) {
                            "ERROR_WRONG_PASSWORD", "ERROR_USER_NOT_FOUND", "ERROR_INVALID_CREDENTIAL" ->
                                "Invalid email or password. Please verify your credentials."
                            "ERROR_TOO_MANY_REQUESTS" ->
                                "Too many attempts. Please try again in a few moments."
                            else -> exc.localizedMessage ?: "Sign in failed."
                        }
                    } else {
                        exc.localizedMessage ?: "Authentication failed."
                    }
                }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(32.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = if (isDark) 0.dp else 4.dp),
            border = if (isDark) CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(MaterialTheme.colorScheme.outline, PrimaryBlue.copy(alpha = 0.3f)))) else null
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // FemSpen Brand Icon with subtle gradient glow
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(RoundedCornerShape(22.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(PrimaryBlue, Color(0xFF38BDF8))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "F",
                        color = Color.White,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "FemSpen",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    letterSpacing = (-0.5).sp
                )

                Text(
                    text = if (isSignUp) "Create your personal & family financial hub" else "Welcome back! Seamless expense sync",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Modern Pill Tab Switcher
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Button(
                            onClick = {
                                isSignUp = false
                                errorMessage = null
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (!isSignUp) PrimaryBlue else Color.Transparent,
                                contentColor = if (!isSignUp) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                isSignUp = true
                                errorMessage = null
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSignUp) PrimaryBlue else Color.Transparent,
                                contentColor = if (isSignUp) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text("Register", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Full Name Field (when registering)
                AnimatedVisibility(
                    visible = isSignUp,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column {
                        OutlinedTextField(
                            value = displayName,
                            onValueChange = { displayName = it },
                            label = { Text("Full Name (e.g., Gaurav Sharma)") },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryBlue)
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                }

                // Email Address
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryBlue)
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Password Field with Eye Toggle
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryBlue)
                    },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    singleLine = true,
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // Confirm Password Field (when registering)
                AnimatedVisibility(
                    visible = isSignUp,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column {
                        Spacer(modifier = Modifier.height(14.dp))
                        OutlinedTextField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            label = { Text("Confirm Password") },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryBlue)
                            },
                            trailingIcon = {
                                IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                                    Icon(
                                        imageVector = if (confirmPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (confirmPasswordVisible) "Hide password" else "Show password",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            },
                            singleLine = true,
                            visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                // Error Message Banner
                errorMessage?.let { msg ->
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.error.copy(alpha = 0.12f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.ErrorOutline,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = msg,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Primary Submit Button
                Button(
                    onClick = { handleAuth() },
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Text(
                            text = if (isSignUp) "Create FemSpen Account" else "Sign In to FemSpen",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
