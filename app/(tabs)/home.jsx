import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  const articles = [
    {
      id: "1",
      title: "Healthy Eating",
      desc: "Tips for balanced nutrition.",
      url: "https://www.healthline.com/nutrition/healthy-eating-tips",
    },
    {
      id: "2",
      title: "Exercise Daily",
      desc: "Stay active to boost your health.",
      url: "https://www.cdc.gov/physical-activity-basics/guidelines/index.html",
    },
    {
      id: "3",
      title: "Mental Wellness",
      desc: "Meditation and stress relief tips.",
      url: "https://www.healthline.com/health/mental-health/self-care-tips",
    },
    {
      id: "4",
      title: "Heart Care",
      desc: "Monitor and maintain heart health.",
      url: "https://www.heart.org/en/healthy-living",
    },
    {
      id: "5",
      title: "Sleep Tips",
      desc: "Improve your sleep quality.",
      url: "https://www.sleepfoundation.org/sleep-hygiene/healthy-sleep-tips",
    },
    {
      id: "6",
      title: "Hydration",
      desc: "Importance of drinking enough water.",
      url: "https://www.health.harvard.edu/staying-healthy/how-much-water-should-you-drink",
    },
  ];

  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert("Nuk mund të hapet ky link.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HealthBuddy</Text>
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
          onPress={() => router.push("/SleepTracker")}
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
          <TouchableOpacity
            key={a.id}
            style={styles.articleCard}
            onPress={() => openLink(a.url)}
          >
            <Text style={styles.articleTitle}>{a.title}</Text>
            <Text style={styles.articleDesc}>{a.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seksioni për Firestore CRUD – Health Goals */}
      <Text style={styles.sectionTitle}>Health Goals (Firestore)</Text>
      <View style={styles.goalsCard}>
        <Text style={styles.goalsText}>
          Create and manage your health goals (water, steps, sleep, blood pressure) stored in Firebase Firestore.
        </Text>
        <TouchableOpacity
          style={styles.goalsButton}
          onPress={() => router.push("/healthGoals")}  
        >
          <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
          <Text style={styles.goalsButtonText}>Open Health Goals</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#E3F2FD" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007ACC",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 25,
    textAlign: "center",
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
    textAlign: "center",
  },
  cardDesc: { fontSize: 12, textAlign: "center", color: "#666", marginTop: 4 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007ACC",
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 15,
  },
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

  // 🔹 Styles për Health Goals seksionin
  goalsCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  goalsText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  goalsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007ACC",
    paddingVertical: 10,
    borderRadius: 10,
  },
  goalsButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 15,
  },
});
