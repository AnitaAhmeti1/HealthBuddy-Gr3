import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import TaskList from "../components/TaskList";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HealthBuddy 🩺</Text>

      <TaskList />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/profile")}
      >
        <Text style={styles.buttonText}>Go to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "#007AFF", padding: 12, borderRadius: 10 },
  buttonText: { color: "white", fontWeight: "bold" },
});
