import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { auth } from "../../firebase";

/** =====================
 * Types & Constants
 * ===================== */

type Badge = {
  id: string;
  label: string;
  threshold: number;
};

type HistoryItem = { dateKey: string; steps: number };

const BADGES: Badge[] = [
  { id: "starter", label: "First 100!", threshold: 100 },
  { id: "streak", label: "1K Club", threshold: 1000 },
  { id: "pro", label: "5K Pro", threshold: 5000 },
  { id: "champ", label: "10K Champ", threshold: 10000 },
];

/** =====================
 * Helpers
 * ===================== */

const checkStepBadge = async (uid: string, currentSteps: number) => {
  if (currentSteps >= 8000) {
    try {
      const badgesData = await AsyncStorage.getItem(`badges_${uid}`);
      const badges = badgesData ? JSON.parse(badgesData) : {};
      const todayDate = new Date().toISOString().split("T")[0];

      if (badges.stepMasterDate !== todayDate) {
        badges.stepMasterDate = todayDate;
        await AsyncStorage.setItem(`badges_${uid}`, JSON.stringify(badges));
        Alert.alert("🏆 Step Master unlocked!", "You've reached 8000 steps today!");
      }
    } catch (e) {
      console.log("Error updating step badge", e);
    }
  }
};

/** =====================
 * Memoized Child Components
 * ===================== */

const BadgeItem = React.memo(({ badge, unlocked }: { badge: Badge; unlocked: boolean }) => {
  return (
    <View
      style={[styles.badge, unlocked ? styles.badgeOn : styles.badgeOff]}
    >
      <Text style={[styles.badgeIcon, { color: unlocked ? "#fff" : "#888" }]}>
        {unlocked ? "🏅" : "🔘"}
      </Text>
      <Text style={styles.badgeText}>{badge.label}</Text>
    </View>
  );
});

const HistoryRow = React.memo(({ item, isToday }: { item: HistoryItem; isToday: boolean }) => {
  const weekday = useMemo(() => {
    const d = new Date(item.dateKey);
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }, [item.dateKey]);

  return (
    <View style={[styles.historyItem, isToday && styles.historyToday]}>
      <Text style={styles.historyDay}>{weekday}</Text>
      <Text>{item.steps.toLocaleString()}</Text>
    </View>
  );
});

/** =====================
 * Screen
 * ===================== */

export default function ActivityTrackerScreen() {
  const [steps, setSteps] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(6000);
  const [level, setLevel] = useState<number>(1);
  const [lastTapTs, setLastTapTs] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string>("");

  /** =====================
   * Effects
   * ===================== */

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setSteps(0);
        setHistory([]);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) return;

    const loadData = async () => {
      const storedSteps = await AsyncStorage.getItem(`steps_${uid}`);
      const storedHistory = await AsyncStorage.getItem(`history_${uid}`);

      if (storedSteps) setSteps(Number(storedSteps));

      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      } else {
        const today = new Date();
        const days: HistoryItem[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateKey = d.toISOString().slice(0, 10);
          days.push({ dateKey, steps: 0 });
        }
        setHistory(days);
      }

      fetchChallenge();
    };

    loadData();
  }, [uid]);

  /** =====================
   * Memoized Values
   * ===================== */

  const progressPct = useMemo(
    () => Math.min(100, Math.round((steps / dailyGoal) * 100)),
    [steps, dailyGoal]
  );

  const weeklyTotal = useMemo(
    () => history.reduce((sum, d) => sum + d.steps, 0),
    [history]
  );

  /** =====================
   * Callbacks
   * ===================== */

  const fetchChallenge = useCallback(() => {
    const challenges = [
      "Walk 5000 steps today!",
      "Do a 10-minute stretch!",
      "Reach 8000 steps today!",
      "Double your steps from yesterday!",
      "Take the stairs instead of the elevator!",
      "Try a 5-minute meditation!",
      "Go for a short run or jog today!",
      "Do 20 push-ups!",
      "Drink at least 2 liters of water today!",
    ];
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setChallenge(`Today's Challenge: ${randomChallenge}`);
  }, []);

  const handleAddSteps = useCallback(
    (count: number) => {
      if (!uid) {
        Alert.alert("Not logged in", "Please log in to track your steps.");
        return;
      }

      setSteps((prev) => {
        const next = Math.max(0, prev + count);
        AsyncStorage.setItem(`steps_${uid}`, next.toString());
        checkStepBadge(uid, next);

        if (next >= dailyGoal) {
          setLevel((l) => l + 1);
          setDailyGoal((g) => Math.round(g * 1.15));
        }
        return next;
      });

      setHistory((prevHistory) => {
        if (prevHistory.length === 0) return prevHistory;
        const todayKey = new Date().toISOString().slice(0, 10);
        let nextHistory = prevHistory;

        if (prevHistory[prevHistory.length - 1]?.dateKey !== todayKey) {
          const days: HistoryItem[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().slice(0, 10);
            const match = prevHistory.find((h) => h.dateKey === dateKey)?.steps ?? 0;
            days.push({ dateKey, steps: match });
          }
          nextHistory = days;
        }

        const updatedHistory = nextHistory.map((d, idx) =>
          idx === nextHistory.length - 1
            ? { ...d, steps: Math.max(0, d.steps + count) }
            : d
        );

        AsyncStorage.setItem(`history_${uid}`, JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    },
    [uid, dailyGoal]
  );

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTs < 300) {
      handleAddSteps(100);
      setLastTapTs(0);
    } else {
      handleAddSteps(20);
      setLastTapTs(now);
    }
  }, [handleAddSteps, lastTapTs]);

  const handleResetAll = useCallback(async () => {
    if (!uid) return;
    setSteps(0);
    setHistory([]);
    await AsyncStorage.setItem(`steps_${uid}`, "0");
    await AsyncStorage.removeItem(`history_${uid}`);
  }, [uid]);

  /** =====================
   * Render
   * ===================== */

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Steps Tracker</Text>
        <Text style={styles.headerEmoji}>🚶‍♂️</Text>
        <Text style={{ marginTop: 4, textAlign: "center" }}>
          Count steps and level up your day.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Today's Steps</Text>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.stepsText}>{steps.toLocaleString()}</Text>
            <Text>of {dailyGoal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={{ marginTop: 4 }}>
          {progressPct}% of {dailyGoal.toLocaleString()} goal
        </Text>

        {Platform.select({
          web: (
            <View style={styles.simControls}>
              <Pressable
                onPress={() => handleAddSteps(100)}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnText}>+100</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAddSteps(1000)}
                style={[styles.btn, styles.btnSecondary]}
              >
                <Text style={styles.btnText}>+1,000</Text>
              </Pressable>
              <Pressable
                onPress={handleResetAll}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnText}>Reset</Text>
              </Pressable>
            </View>
          ),
          default: (
            <Text style={{ marginTop: 8 }}>
              Tap the big button below to simulate steps. Double-tap for a boost!
            </Text>
          ),
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Level</Text>
        <View style={styles.levelRow}>
          <Text style={styles.levelIcon}>★</Text>
          <Text style={styles.levelText}>Lv. {level}</Text>
        </View>
        <Text style={{ marginTop: 4 }}>
          Reach your goal to level up. Each level raises your daily goal slightly.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Badges</Text>
        <FlatList
          data={BADGES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <BadgeItem badge={item} unlocked={steps >= item.threshold} />
          )}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Daily & Weekly</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalPill}>
            <Text style={styles.totalIcon}>📅</Text>
            <Text style={styles.totalText}>Today: {steps.toLocaleString()}</Text>
          </View>
          <View style={styles.totalPill}>
            <Text style={styles.totalIcon}>🗓️</Text>
            <Text style={styles.totalText}>Week: {weeklyTotal.toLocaleString()}</Text>
          </View>
        </View>

        <FlatList
          data={history}
          keyExtractor={(item) => item.dateKey}
          numColumns={3}
          renderItem={({ item, index }) => (
            <HistoryRow item={item} isToday={index === history.length - 1} />
          )}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Fitness Challenge</Text>
        <Text>{challenge}</Text>
      </View>

      <Pressable onPress={handleTap} style={styles.fab}>
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>Add Steps</Text>
      </Pressable>
    </ScrollView>
  );
}

/** =====================
 * Styles
 * ===================== */

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backButton: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: "#54C29A", fontWeight: "700" },
  headerEmoji: { fontSize: 48, marginBottom: 4, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "700", marginVertical: 8, textAlign: "center" },
  card: { padding: 12, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", marginBottom: 12 },
  stepsText: { fontSize: 44, fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  circleContainer: { alignItems: "center", marginVertical: 12 },
  circle: { width: 150, height: 150, borderRadius: 75, borderWidth: 6, borderColor: "#54C29A", justifyContent: "center", alignItems: "center" },
  progressBar: { height: 10, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 6, overflow: "hidden", marginVertical: 6 },
  progressFill: { height: "100%", backgroundColor: "#54C29A" },
  simControls: { flexDirection: "row", marginTop: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 },
  btnPrimary: { backgroundColor: "#54C29A" },
  btnSecondary: { backgroundColor: "#50A2F9" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  btnText: { color: "#3c3c3cff", fontWeight: "700" },
  levelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  levelIcon: { fontSize: 22, color: "#E6B800" },
  levelText: { marginLeft: 8, fontSize: 20, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 },
  badgeOn: { backgroundColor: "#54C29A" },
  badgeOff: { backgroundColor: "rgba(0,0,0,0.06)" },
  badgeText: { color: "#4e4c4cff" },
  badgeIcon: { fontSize: 16, marginRight: 4 },
  totalsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  totalPill: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.06)", marginRight: 8, marginBottom: 8 },
  totalIcon: { fontSize: 16, marginRight: 4 },
  totalText: { fontWeight: "700" },
  historyItem: { flex: 1, margin: 4, padding: 8, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.04)" },
  historyToday: { borderWidth: 1, borderColor: "#54C29A" },
  historyDay: { fontWeight: "700", marginBottom: 2 },
  fab: { marginTop: 16, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#54C29A" },
  fabIcon: { color: "#fff", fontSize: 20, marginRight: 6 },
  fabText: { color: "#fff", fontWeight: "700" },
});
