import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

// Komponent i memoizuar për butonin e Google
const GoogleButton = React.memo(({ onPress, loading }) => (
  <TouchableOpacity
    style={[styles.googleButton, loading && { opacity: 0.7 }]}
    onPress={onPress}
    disabled={loading}
  >
    <View style={styles.googleContent}>
      <Text style={styles.googleButtonText}>Continue with Google</Text>
    </View>
  </TouchableOpacity>
));

// Komponent i memoizuar për divider
const Divider = React.memo(() => (
  <View style={styles.dividerContainer}>
    <View style={styles.divider} />
    <Text style={styles.dividerText}>or</Text>
    <View style={styles.divider} />
  </View>
));

export default function LoginScreen() {
  const [email, setEmail] = useState("");       
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const gradientColors = useMemo(() => ["#c2e9fb", "#a1c4fd"], []);

  const validate = useCallback(() => {
    if (!email.trim() || !password.trim()) {
      setError("Both fields are required");
      return false;
    }
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!re.test(email)) {
      setError("Email is not valid");
      return false;
    }
    setError("");
    return true;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/home");
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        setError("Incorrect email or password");
      } else if (e.code === "auth/user-not-found") {
        setError("No user found with this email");
      } else {
        setError(e.message ?? "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, validate, router]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.replace("/home");
    } catch (e) {
      console.log("Google sign in error", e);
      if (e.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled");
      } else {
        setError("Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const goToRegister = useCallback(() => router.push("/register"), [router]);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.card}>
        {/* Logo normal */}
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Divider />

        <GoogleButton onPress={handleGoogleSignIn} loading={loading} />

        <View style={styles.registerContainer}>
          <Text style={styles.text}>Don't have an account? </Text>
          <TouchableOpacity onPress={goToRegister}>
            <Text style={styles.link}>Register now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  logo: { width: 120, height: 120, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#007AFF" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 25 },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  registerContainer: { flexDirection: "row", marginTop: 15 },
  text: { color: "#444" },
  link: { color: "#007AFF", fontWeight: "600" },
  error: { color: "red", marginBottom: 8, textAlign: "center" },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#888",
    fontSize: 13,
  },

  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  googleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
  },
});
