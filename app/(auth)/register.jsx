import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase"; 

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const validate = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return false;
    }
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!re.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setModalVisible(true);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setError("Email already exists");
      } else {
        setError(e.message ?? "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    router.push("/login");
  };

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />
        <Text style={styles.title}>Create new account</Text>
        <Text style={styles.subtitle}>Join HealthBuddy and start tracking your health</Text>

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
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>User created successfully!</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalBtn}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  subtitle: { fontSize: 14, color: "#666", marginBottom: 25, textAlign: "center" },
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
  link: { color: "#007AFF", fontWeight: "600", marginTop: 15 },
  error: { color: "red", marginBottom: 8, textAlign: "center" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 14, color: "#333" },
  modalBtn: {
    marginTop: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
});
