import { View, Text, StyleSheet, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase";   

export default function BadgesScreen() {
  const [badges, setBadges] = useState([]);
  const [uid, setUid] = useState(null);

  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setBadges([]); 
      }
    });

    return unsubscribe;
  }, []);

  
  useEffect(() => {
    if (!uid) return; 

    const loadBadges = async () => {
      try {
        // i njëjti key si te WaterTracker: `badges_${uid}`
        const badgeData = await AsyncStorage.getItem(`badges_${uid}`);
        const storedBadges = badgeData ? JSON.parse(badgeData) : {};
        const today = new Date().toISOString().split("T")[0];

        const data = [
          {
            id: "1",
            title: "Hydration Hero",
            desc: "Drank 3500ml in one day",
            icon: "water-outline",
            color: "#00BFFF",
            unlocked: storedBadges.hydrationHeroDate === today,
          },
          {
            id: "2",
            title: "Step Master",
            desc: "Reached 8000 steps in one day",
            icon: "walk-outline",
            color: "#32CD32",
            unlocked: storedBadges.stepMasterDate === today,
          },
          {
            id: "3",
            title: "Healthy Heart",
            desc: "Kept blood pressure normal",
            icon: "heart-outline",
            color: "#FF6347",
            unlocked: storedBadges.healthyHeartDate === today,
          },
          {
            id: "4",
            title: "Sleep Champ",
            desc: "Slept more than 7 hours",
            icon: "bed-outline",
            color: "#6A5ACD",
            unlocked: storedBadges.sleepChampDate === today,
          },
        ];

        setBadges(data);
      } catch (e) {
        console.log("Error loading badges", e);
      }
    };

    loadBadges();
  }, [uid]); 

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Achievements</Text>
      <FlatList
        data={badges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.badgeCard,
              item.unlocked ? styles.unlocked : styles.locked,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={40}
              color={item.unlocked ? item.color : "#999"}
            />
            <Text style={styles.badgeTitle}>{item.title}</Text>
            <Text style={styles.badgeDesc}>{item.desc}</Text>
            <Text
              style={[
                styles.badgeStatus,
                { color: item.unlocked ? "#32CD32" : "#FF6347" },
              ]}
            >
              {item.unlocked ? "Unlocked Today!" : "Locked"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007ACC",
    marginBottom: 20,
  },
  badgeCard: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  badgeDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  badgeStatus: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: "bold",
  },
  unlocked: {
    borderColor: "#32CD32",
    borderWidth: 2,
  },
  locked: {
    opacity: 0.7,
    borderColor: "#ccc",
    borderWidth: 1,
  },
});
