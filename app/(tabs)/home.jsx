import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  const articles = [
    { id: "1", title: "Healthy Eating", desc: "Tips for balanced nutrition." },
    { id: "2", title: "Exercise Daily", desc: "Stay active to boost your health." },
    { id: "3", title: "Mental Wellness", desc: "Meditation and stress relief tips." },
    { id: "4", title: "Heart Care", desc: "Monitor and maintain heart health." },
    { id: "5", title: "Sleep Tips", desc: "Improve your sleep quality." },
    { id: "6", title: "Hydration", desc: "Importance of drinking enough water." },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HealthBuddy 🩺</Text>
      <Text style={styles.subtitle}>Welcome back! Choose a section below.</Text>

      {/* Kartat kryesore */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/waterRemainder")}
        >
          <Ionicons name="water-outline" size={40} color="#00BFFF" />
          <Text style={styles.cardTitle}>Water Tracker</Text>
          <Text style={styles.cardDesc}>Track your daily hydration 💧</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/BloodPressureScreen")}
        >
          <Ionicons name="heart-outline" size={40} color="#FF6347" />
          <Text style={styles.cardTitle}>Blood Pressure</Text>
          <Text style={styles.cardDesc}>Monitor your BP and pulse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/sleepTracker")}
        >
          <Ionicons name="bed-outline" size={40} color="#6A5ACD" />
          <Text style={styles.cardTitle}>Sleep Tracker</Text>
          <Text style={styles.cardDesc}>Track your sleep hours 🛌</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/ActivityTracker")}
        >
          <Ionicons name="walk-outline" size={40} color="#32CD32" />
          <Text style={styles.cardTitle}>Steps Tracker</Text>
          <Text style={styles.cardDesc}>Count your daily steps 👣</Text>
        </TouchableOpacity>
      </View>

      {/* Artikuj shëndetësorë */}
      <Text style={styles.sectionTitle}>Health Articles</Text>
      <View style={styles.articleContainer}>
        {articles.map((a) => (
          <TouchableOpacity key={a.id} style={styles.articleCard}>
            <Text style={styles.articleTitle}>{a.title}</Text>
            <Text style={styles.articleDesc}>{a.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#E3F2FD" },
  title: { fontSize: 28, fontWeight: "bold", color: "#007ACC", marginBottom: 5, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 25, textAlign: "center" },
  cardContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
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
  cardTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, color: "#333", textAlign: "center" },
  cardDesc: { fontSize: 12, textAlign: "center", color: "#666", marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#007ACC", marginTop: 30, marginBottom: 10, marginLeft: 15 },
  articleContainer: { paddingHorizontal: 15 },
  articleCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  articleTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  articleDesc: { fontSize: 13, color: "#555", marginTop: 4 },
});
