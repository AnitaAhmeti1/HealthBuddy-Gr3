import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthBuddy 🩺</Text>
      <Text style={styles.subtitle}>Welcome back! Choose a section below.</Text>

      <View style={styles.cardContainer}>
        {/* Water Tracker */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/waterRemainder")}
        >
          <Ionicons name="water-outline" size={40} color="#00BFFF" />
          <Text style={styles.cardTitle}>Water Tracker</Text>
          <Text style={styles.cardDesc}>Track your daily hydration 💧</Text>
        </TouchableOpacity>

        {/* Blood Pressure */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/BloodPressureScreen")}
        >
          <Ionicons name="heart-outline" size={40} color="#FF6347" />
          <Text style={styles.cardTitle}>Blood Pressure</Text>
          <Text style={styles.cardDesc}>Monitor your BP and pulse</Text>
        </TouchableOpacity>

        {/* Sleep Tracker */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/sleepTracker")}
        >
          <Ionicons name="bed-outline" size={40} color="#6A5ACD" />
          <Text style={styles.cardTitle}>Sleep Tracker</Text>
          <Text style={styles.cardDesc}>Track your sleep hours 🛌</Text>
        </TouchableOpacity>

        {/* Steps Tracker */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/stepsTracker")}
        >
          <Ionicons name="walk-outline" size={40} color="#32CD32" />
          <Text style={styles.cardTitle}>Steps Tracker</Text>
          <Text style={styles.cardDesc}>Count your daily steps 👣</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007ACC",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 25,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "40%",
    alignItems: "center",
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  cardDesc: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    position: "absolute",
    bottom: 40,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
