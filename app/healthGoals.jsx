import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import {
  addHealthGoal,
  loadHealthGoals,
  updateHealthGoal,
  deleteHealthGoal,
} from "../services/healthGoalsServices";

const CATEGORIES = [
  { key: "water", label: "Water" },
  { key: "steps", label: "Steps" },
  { key: "sleep", label: "Sleep" },
  { key: "bp", label: "Blood Pressure" },
];

export default function HealthGoalsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("water");
  const [target, setTarget] = useState("");
  const [goals, setGoals] = useState([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Real-time reading of goals from Firestore
  useEffect(() => {
    if (!user) return;
    setLoadingList(true);
    setError("");

    const unsubscribe = loadHealthGoals(user, (data) => {
      setGoals(data);
      setLoadingList(false);
    });

    return () => unsubscribe && unsubscribe();
  }, [user]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleAddGoal = async () => {
    resetMessages();

    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (!title.trim() || !target.trim()) {
      setError("Please fill in both title and target.");
      return;
    }

    try {
      setLoadingAction(true);
      await addHealthGoal(user, title.trim(), category, target.trim());
      setTitle("");
      setTarget("");
      setSuccess("Health goal added successfully.");
    } catch (e) {
      setError("Error while adding the goal.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleCompleted = async (goal) => {
    if (!user) return;
    resetMessages();
    try {
      setLoadingAction(true);
      await updateHealthGoal(user, goal.id, {
        completed: !goal.completed,
      });
      setSuccess("Health goal updated.");
    } catch (e) {
      setError("Error while updating the goal.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (goalId) => {
    if (!user) return;
    resetMessages();
    try {
      setLoadingAction(true);
      await deleteHealthGoal(user, goalId);
      setSuccess("Health goal deleted.");
    } catch (e) {
      setError("Error while deleting the goal.");
    } finally {
      setLoadingAction(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007ACC" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#333" }}>
          You are not logged in. Please log in again.
        </Text>
      </View>
    );
  }

  const renderGoalItem = ({ item }) => (
    <View
      style={[
        styles.goalItem,
        item.completed && { borderColor: "#32CD32", backgroundColor: "#E8F8E8" },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.goalTitle}>
          {item.title} {item.completed ? "(Completed)" : ""}
        </Text>
        <Text style={styles.goalMeta}>
          Category: {item.category} • Target: {item.target}
        </Text>
      </View>
      <View style={styles.goalActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#007ACC" }]}
          onPress={() => handleToggleCompleted(item)}
        >
          <Ionicons
            name={item.completed ? "refresh-outline" : "checkmark-done-outline"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FF3B30" }]}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Health Goals</Text>
      </View>

      {/* Form for adding a new goal */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create New Goal</Text>

        <TextInput
          style={styles.input}
          placeholder="Title (e.g. Drink 3500 ml water)"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Target (e.g. 3500 ml, 8000 steps)"
          value={target}
          onChangeText={setTarget}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => {
            const selected = c.key === category;
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(c.key)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextSelected,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {!!success && <Text style={styles.successText}>{success}</Text>}

        <TouchableOpacity
          style={[styles.saveButton, loadingAction && { opacity: 0.7 }]}
          onPress={handleAddGoal}
          disabled={loadingAction}
        >
          {loadingAction ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Goal</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* List of goals from Firestore */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Goals</Text>

        {loadingList ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#007ACC" />
            <Text style={{ marginTop: 6, color: "#555" }}>Loading goals...</Text>
          </View>
        ) : goals.length === 0 ? (
          <Text style={{ color: "#666", fontSize: 14 }}>
            You don't have any goals yet. Add one above.
          </Text>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={renderGoalItem}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    fontSize: 24,
    color: "#007ACC",
    fontWeight: "bold",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007ACC",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginTop: 4,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBBBBB",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: "#007ACC",
    borderColor: "#007ACC",
  },
  categoryText: {
    fontSize: 13,
    color: "#555",
  },
  categoryTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#007ACC",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#FF3B30",
    marginTop: 4,
    marginBottom: 4,
    fontSize: 13,
  },
  successText: {
    color: "#32CD32",
    marginTop: 4,
    marginBottom: 4,
    fontSize: 13,
  },
  goalItem: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 8,
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  goalMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  goalActions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
