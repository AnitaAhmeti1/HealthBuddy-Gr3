import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import * as Progress from 'react-native-progress';

export default function WaterTracker() {
  const router = useRouter(); 
  const [waterIntake, setWaterIntake] = useState(0);
  const [goal, setGoal] = useState(3500);
  const [drinkingLog, setDrinkingLog] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  const motivationalQuotes = [
    "Stay hydrated, stay healthy! 💧",
    "Every sip counts! 🌊",
    "Keep it flowing! 💦",
    "Hydration = energy ⚡",
    "Water your body like a plant 🌱",
  ];
  const overhydrationQuotes = [
    "Whoa! Take it easy, don't overdo it! ⚠️",
    "Hydration is good, but moderation is key 💧",
    "Slow down, your body needs balance 🧘‍♂️",
  ];

  const [quote, setQuote] = useState("");

  const getToday = () => new Date().toISOString().split('T')[0];

  const rawProgress = waterIntake / goal;
  const progress = Math.min(rawProgress, 1);
  let progressColor = '#00BFFF';
  if (rawProgress > 1 && rawProgress <= 1.5) progressColor = '#32CD32';
  else if (rawProgress > 1.5) progressColor = '#FF4500';


  useEffect(() => {
    if (rawProgress <= 1) {
      setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    } else {
      setQuote(overhydrationQuotes[Math.floor(Math.random() * overhydrationQuotes.length)]);
    }
  }, [waterIntake]);

  
useEffect(() => {
  const loadData = async () => {
    try {
      const savedWater = await AsyncStorage.getItem('waterIntake');
      const savedLog = await AsyncStorage.getItem('drinkingLog');
      const savedHistory = await AsyncStorage.getItem('dailyHistory');
      const savedDate = await AsyncStorage.getItem('lastSavedDate');

      if (savedWater !== null) setWaterIntake(JSON.parse(savedWater));
      if (savedLog !== null) setDrinkingLog(JSON.parse(savedLog));
      if (savedHistory !== null) setDailyHistory(JSON.parse(savedHistory));

      const currentDate = getToday();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      
      if ((!savedDate || savedDate !== currentDate) && 
          (currentHour > 0 || (currentHour === 0 && currentMinute >= 0))) {
        await resetDailyIntake(savedDate || currentDate);
      }
    } catch (error) {
      console.log('Error loading data', error);
    }
  };
  loadData();
}, []);

  
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
  }, []);

 
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('waterIntake', JSON.stringify(waterIntake));
        await AsyncStorage.setItem('drinkingLog', JSON.stringify(drinkingLog));
        await AsyncStorage.setItem('dailyHistory', JSON.stringify(dailyHistory));
        await AsyncStorage.setItem('lastSavedDate', getToday());
      } catch (error) {
        console.log('Error saving data', error);
      }
    };
    saveData();
  }, [waterIntake, drinkingLog, dailyHistory]);

  
  const addWater = (amount) => {
    const currentTime = new Date().toLocaleTimeString();
    const newIntake = waterIntake + amount;
    const newLog = [...drinkingLog, { time: currentTime, amount, id: Date.now().toString() }];
    setWaterIntake(newIntake);
    setDrinkingLog(newLog);
    checkHydrationBadge(newIntake);
  };

  const deleteWaterLog = (id, amount) => {
    const updatedLog = drinkingLog.filter(item => item.id !== id);
    setDrinkingLog(updatedLog);
    setWaterIntake(waterIntake - amount);
  };

 
  const checkHydrationBadge = async (currentIntake) => {
    if (currentIntake >= goal) {
      try {
        const badgesData = await AsyncStorage.getItem("badges");
        const badges = badgesData ? JSON.parse(badgesData) : {};
        const todayDate = getToday();

        if (badges.hydrationHeroDate !== todayDate) {
          badges.hydrationHeroDate = todayDate;
          await AsyncStorage.setItem("badges", JSON.stringify(badges));
          Alert.alert("🏆 Hydration Hero unlocked!", "You've reached your daily water goal!");
        }
      } catch (e) {
        console.log("Error updating badges", e);
      }
    }
  };


  const resetDailyIntake = async (previousDate) => {
    try {
      if (previousDate) {
        const dailyPercent = Math.round((waterIntake / goal) * 100);

       const timestamp = new Date().toISOString();
      const newHistory = [...dailyHistory, { date: timestamp, percent: dailyPercent }];

        const trimmedHistory = newHistory.slice(-30);
        setDailyHistory(trimmedHistory);
        await AsyncStorage.setItem('dailyHistory', JSON.stringify(trimmedHistory));

        if (waterIntake >= goal) {
          const badgesData = await AsyncStorage.getItem("badges");
          const badges = badgesData ? JSON.parse(badgesData) : {};
          badges.hydrationHeroDate = previousDate;
          await AsyncStorage.setItem("badges", JSON.stringify(badges));
        }
      }
      setWaterIntake(0);
      setDrinkingLog([]);
      await AsyncStorage.setItem('waterIntake', JSON.stringify(0));
      await AsyncStorage.setItem('drinkingLog', JSON.stringify([]));
      await AsyncStorage.setItem('lastSavedDate', getToday());
    } catch (error) {
      console.log('Error resetting daily intake', error);
    }
  };


const recentDays = dailyHistory.slice(-7);
const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

const chartData = {
  labels: recentDays.map(item => {
    const dateObj = new Date(item.date);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day} ${time}`;
  }),
  datasets: [
    {
      data: recentDays.map(item => item.percent),
    },
  ],
};


  // Create a combined data array for the FlatList
  const listData = [
    { type: 'header', id: 'header' },
    { type: 'progress', id: 'progress' },
    { type: 'chart', id: 'chart' },
    { type: 'buttons', id: 'buttons' },
    ...drinkingLog.map(item => ({ type: 'log', ...item }))
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View>
            <Text style={styles.dateText}>Today is {currentDate}</Text>
            <Text style={styles.quote}>{quote}</Text>
          </View>
        );
      
      case 'progress':
        return (
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
        );
      
      case 'chart':
        return recentDays.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.weekTitle}>Weekly Hydration Progress</Text>
            <BarChart
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
                propsForLabels: { fontSize: 10 },
              }}
              style={styles.chart}
            />
          </View>
        ) : null;
      
      case 'buttons':
        return (
          <View style={{ width: '100%', paddingHorizontal: 10 }}>
            <View style={styles.buttonRow}>
              {[200, 300, 400, 500].map(amount => (
                <TouchableOpacity key={amount} style={styles.addButton} onPress={() => addWater(amount)}>
                  <Text style={styles.addButtonText}>+{amount} ml</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 'log':
        return (
          <View style={styles.logItem}>
            <Text style={styles.logText}>Drank {item.amount} ml at {item.time}</Text>
            <TouchableOpacity onPress={() => deleteWaterLog(item.id, item.amount)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
  },
  dateText: { fontSize: 18, color: '#007ACC', fontWeight: '500', marginBottom: 8 },
  quote: { fontSize: 16, color: '#444', fontStyle: 'italic', marginBottom: 15, textAlign: 'center', paddingHorizontal: 20 },
  progressContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  subText: { fontSize: 16, color: '#555', marginTop: 10 },
  chartContainer: { marginBottom: 20 },
  weekTitle: { fontSize: 18, fontWeight: 'bold', color: '#007ACC', marginBottom: 10, textAlign: 'center' },
  chart: { borderRadius: 10 },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between', 
  width: '100%',
  marginVertical: 10,
},
addButton: {
  backgroundColor: '#00BFFF',
  paddingVertical: 12,
  flex: 1,              
  marginHorizontal: 4,
  borderRadius: 20,
  alignItems: 'center',
},
addButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
logItem: {
  backgroundColor: '#fff',
  paddingVertical: 15,
  paddingHorizontal: 15,
  borderRadius: 10,
  marginVertical: 5,
  width: '100%',         
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

  logText: { fontSize: 17, color: '#333', flex: 1, flexWrap: 'wrap' },
  deleteButton: { backgroundColor: '#FF6347', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { marginBottom: 12,top:12, left:10, padding: 10, alignSelf: "flex-start" },
  backText: { fontSize: 24, color: "#007ACC", fontWeight: "bold" },
  
});
