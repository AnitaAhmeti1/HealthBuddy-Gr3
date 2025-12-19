import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { auth } from '../../firebase';

// Lazy load BarChart
const LazyBarChart = React.lazy(() => import("react-native-chart-kit").then(module => ({ default: module.BarChart })));

export default function WaterTracker() {
  const router = useRouter(); 
  const [waterIntake, setWaterIntake] = useState(0);
  const [goal, setGoal] = useState(3500);
  const [drinkingLog, setDrinkingLog] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [uid, setUid] = useState(null);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
  const [quote, setQuote] = useState("");

  const motivationalQuotes = useMemo(() => [
    "Stay hydrated, stay healthy! 💧",
    "Every sip counts! 🌊",
    "Keep it flowing! 💦",
    "Hydration = energy ⚡",
    "Water your body like a plant 🌱",
  ], []);

  const overhydrationQuotes = useMemo(() => [
    "Whoa! Take it easy, don't overdo it! ⚠️",
    "Hydration is good, but moderation is key 💧",
    "Slow down, your body needs balance 🧘‍♂️",
  ], []);

  const getToday = useCallback(() => new Date().toISOString().split('T')[0], []);

  const rawProgress = useMemo(() => waterIntake / goal, [waterIntake, goal]);
  const progress = useMemo(() => Math.min(rawProgress, 1), [rawProgress]);
  const progressColor = useMemo(() => {
    if (rawProgress > 1.5) return '#FF4500';
    if (rawProgress > 1) return '#32CD32';
    return '#00BFFF';
  }, [rawProgress]);

  // Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
      else setUid(null);
    });
    return unsubscribe;
  }, []);

  // Fetch motivational quote
  useEffect(() => {
    const updateTip = async () => {
      try {
        const response = await fetch("https://api.quotable.io/random?tags=inspirational");
        if (!response.ok) throw new Error("Failed to fetch quote");
        const data = await response.json();
        setQuote(`${data.content} — ${data.author}`);
      } catch (err) {
        console.log("Error:", err);
        setQuote("Stay healthy 💧");
      }
    };
    updateTip();
  }, [waterIntake]);

  // Load saved data
  useEffect(() => {
    if (!uid) return;
    const loadData = async () => {
      try {
        const [savedWater, savedLog, savedHistory, savedDate] = await Promise.all([
          AsyncStorage.getItem(`waterIntake_${uid}`),
          AsyncStorage.getItem(`drinkingLog_${uid}`),
          AsyncStorage.getItem(`dailyHistory_${uid}`),
          AsyncStorage.getItem(`lastSavedDate_${uid}`),
        ]);

        if (savedWater !== null) setWaterIntake(JSON.parse(savedWater));
        if (savedLog !== null) setDrinkingLog(JSON.parse(savedLog));
        if (savedHistory !== null) setDailyHistory(JSON.parse(savedHistory));

        const currentDate = getToday();
        if (savedDate !== currentDate) {
          await resetDailyIntake(savedDate || currentDate);
        }
      } catch (error) {
        console.log('Error loading data', error);
      }
    };
    loadData();
  }, [uid, getToday]);

  // Schedule daily reset at midnight
  useEffect(() => {
    const scheduleReset = () => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setHours(0, 0, 0, 0);
      if (nextReset < now) nextReset.setDate(nextReset.getDate() + 1);

      setTimeout(async () => {
        await resetDailyIntake(getToday());
        setToday(getToday());
        scheduleReset();
      }, nextReset.getTime() - now.getTime());
    };
    scheduleReset();
  }, [getToday]);

  // Save data when intake/log/history changes
  useEffect(() => {
    if (!uid) return;
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(`waterIntake_${uid}`, JSON.stringify(waterIntake));
        await AsyncStorage.setItem(`drinkingLog_${uid}`, JSON.stringify(drinkingLog));
        await AsyncStorage.setItem(`dailyHistory_${uid}`, JSON.stringify(dailyHistory));
        await AsyncStorage.setItem(`lastSavedDate_${uid}`, getToday());
      } catch (error) {
        console.log('Error saving data', error);
      }
    };
    saveData();
  }, [waterIntake, drinkingLog, dailyHistory, uid, getToday]);

  const addWater = useCallback(async (amount) => {
    if (!uid) return;
    const currentTime = new Date().toLocaleTimeString();
    const newIntake = waterIntake + amount;
    const newLog = [...drinkingLog, { time: currentTime, amount, id: Date.now().toString() }];
    setWaterIntake(newIntake);
    setDrinkingLog(newLog);
    await AsyncStorage.setItem(`waterIntake_${uid}`, JSON.stringify(newIntake));
    await AsyncStorage.setItem(`drinkingLog_${uid}`, JSON.stringify(newLog));
    checkHydrationBadge(newIntake);
  }, [waterIntake, drinkingLog, uid]);

  const deleteWaterLog = useCallback((id, amount) => {
    const updatedLog = drinkingLog.filter(item => item.id !== id);
    setDrinkingLog(updatedLog);
    setWaterIntake(waterIntake - amount);
  }, [drinkingLog, waterIntake]);

  const checkHydrationBadge = useCallback(async (currentIntake) => {
    if (!uid) return;
    if (currentIntake >= goal) {
      try {
        const badgesData = await AsyncStorage.getItem(`badges_${uid}`);
        const badges = badgesData ? JSON.parse(badgesData) : {};
        const todayDate = getToday();
        if (badges.hydrationHeroDate !== todayDate) {
          badges.hydrationHeroDate = todayDate;
          await AsyncStorage.setItem(`badges_${uid}`, JSON.stringify(badges));
          Alert.alert("🏆 Hydration Hero unlocked!", "You've reached your daily water goal!");
        }
      } catch (e) {
        console.log("Error updating badges", e);
      }
    }
  }, [goal, uid, getToday]);

  const resetDailyIntake = useCallback(async (previousDate) => {
    if (!uid) return;
    try {
      if (previousDate) {
        const dailyPercent = Math.round((waterIntake / goal) * 100);
        const timestamp = new Date().toISOString();
        const newHistory = [...dailyHistory, { date: timestamp, percent: dailyPercent }];
        const trimmedHistory = newHistory.slice(-30);
        setDailyHistory(trimmedHistory);
        await AsyncStorage.setItem(`dailyHistory_${uid}`, JSON.stringify(trimmedHistory));
      }
      setWaterIntake(0);
      setDrinkingLog([]);
      await AsyncStorage.setItem(`waterIntake_${uid}`, JSON.stringify(0));
      await AsyncStorage.setItem(`drinkingLog_${uid}`, JSON.stringify([]));
      await AsyncStorage.setItem(`lastSavedDate_${uid}`, getToday());
    } catch (error) {
      console.log('Error resetting daily intake', error);
    }
  }, [uid, waterIntake, dailyHistory, goal, getToday]);

  const recentDays = useMemo(() => dailyHistory.slice(-7), [dailyHistory]);
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), []);

  const chartData = useMemo(() => ({
    labels: recentDays.map((item) => {
      const dateObj = new Date(item.date);
      const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${day}\n${time} \t`;
    }),
    datasets: [
      { data: recentDays.map(item => item.percent) }
    ],
  }), [recentDays]);

  const renderHeader = useCallback(() => (
    <View>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/home")}
        style={styles.backButton}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.dateText}>Today is {currentDate}</Text>
      <Text style={styles.quote}>{quote}</Text>

      <View style={styles.progressContainer}>
        <Progress.Circle
          size={200}
          progress={progress}
          showsText={true}
          color={progressColor}
          unfilledColor={'#E0F7FA'}
          borderWidth={3}
          thickness={10}
          textStyle={{ color: '#007ACC', fontWeight: 'bold', fontSize: 20 }}
          formatText={() => `${Math.round(rawProgress * 100)}%`}
          animated={true}
        />
        <Text style={styles.subText}>{waterIntake} ml of {goal} ml</Text>
      </View>

      {recentDays.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.weekTitle}>Weekly Hydration Progress</Text>
          <Suspense fallback={<Text>Loading chart...</Text>}>
            <LazyBarChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={200}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: "#E3F2FD",
                backgroundGradientFrom: "#E3F2FD",
                backgroundGradientTo: "#BBDEFB",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 204, ${opacity})`,
                labelColor: () => "#007ACC",
                propsForLabels: { fontSize: 8, textAlign: 'center', numberOfLines: 2, lineHeight: 10 },
              }}
              style={styles.chart}
            />
          </Suspense>
        </View>
      )}

      <View style={{ width: '100%', paddingHorizontal: 10 }}>
        <View style={styles.buttonRow}>
          {[200, 300, 400, 500].map(amount => (
            <TouchableOpacity key={amount} style={styles.addButton} onPress={() => addWater(amount)}>
              <Text style={styles.addButtonText}>+{amount} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  ), [router, currentDate, quote, progress, progressColor, rawProgress, waterIntake, goal, recentDays, chartData, addWater]);

  const renderLogItemMemo = useCallback(({ item }) => (
    <View style={styles.logItem}>
      <Text style={styles.logText}>Drank {item.amount} ml at {item.time}</Text>
      <TouchableOpacity onPress={() => deleteWaterLog(item.id, item.amount)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  ), [deleteWaterLog]);

  return (
    <FlatList
      data={drinkingLog}
      renderItem={renderLogItemMemo}
      keyExtractor={item => item.id}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      initialNumToRender={5}
      windowSize={10}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    minHeight: '100%',
  },
  dateText: { fontSize: 18, color: '#007ACC', fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  quote: { fontSize: 16, color: '#444', fontStyle: 'italic', marginBottom: 15, textAlign: 'center', paddingHorizontal: 20 },
  progressContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  subText: { fontSize: 16, color: '#555', marginTop: 10 },
  chartContainer: { marginBottom: 20 },
  weekTitle: { fontSize: 18, fontWeight: 'bold', color: '#007ACC', marginBottom: 10, textAlign: 'center' },
  chart: { borderRadius: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 10 },
  addButton: { backgroundColor: '#00BFFF', paddingVertical: 12, flex: 1, marginHorizontal: 4, borderRadius: 20, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logItem: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10, marginVertical: 5, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logText: { fontSize: 17, color: '#333', flex: 1, flexWrap: 'wrap' },
  deleteButton: { backgroundColor: '#FF6347', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { marginBottom: 12, padding: 10, alignSelf: "flex-start" },
  backText: { fontSize: 24, color: "#007ACC", fontWeight: "bold" },
});
