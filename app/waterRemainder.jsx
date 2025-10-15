import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';

export default function App() {
  const [waterIntake, setWaterIntake] = useState(0);
  const [goal, setGoal] = useState(3500); 
  const [drinkingLog, setDrinkingLog] = useState([]);

  
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedWater = await AsyncStorage.getItem('waterIntake');
        const savedLog = await AsyncStorage.getItem('drinkingLog');
        if (savedWater !== null) setWaterIntake(JSON.parse(savedWater));
        if (savedLog !== null) setDrinkingLog(JSON.parse(savedLog));
      } catch (error) {
        console.log('Error loading data', error);
      }
    };
    loadData();
  }, []);
    useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('waterIntake', JSON.stringify(waterIntake));
        await AsyncStorage.setItem('drinkingLog', JSON.stringify(drinkingLog));
      } catch (error) {
        console.log('Error saving data', error);
      }
    };
    saveData();
  }, [waterIntake, drinkingLog]);


  const addWater = (amount) => {
    const currentTime = new Date().toLocaleTimeString();
    const newIntake = waterIntake + amount;
    const newLog = [...drinkingLog, { time: currentTime, amount, id: Date.now().toString() }];
    setWaterIntake(newIntake);
    setDrinkingLog(newLog);
  };

 
  const deleteWaterLog = (id, amount) => {
    const updatedLog = drinkingLog.filter(item => item.id !== id);
    setDrinkingLog(updatedLog);
    setWaterIntake(waterIntake - amount);
  };

  
  const rawProgress = waterIntake / goal;
  const progress = Math.min(rawProgress, 1);

  let progressColor = '#00BFFF';
  if (rawProgress > 1 && rawProgress <= 1.5) progressColor = '#32CD32';
  else if (rawProgress > 1.5) progressColor = '#FF4500';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Water Tracker 💧</Text>

      {/* Rrethi i progresit */}
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

      {/* Butonat për shtimin e ujit */}
      <View style={styles.buttonRow}>
        {[200, 300, 400, 500].map(amount => (
          <TouchableOpacity key={amount} style={styles.addButton} onPress={() => addWater(amount)}>
            <Text style={styles.addButtonText}>+{amount} ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista e aktiviteteve */}
      <FlatList
        data={drinkingLog}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.logText}>Drank {item.amount} ml at {item.time}</Text>
            <TouchableOpacity onPress={() => deleteWaterLog(item.id, item.amount)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#E3F2FD',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007ACC',
    marginBottom: 25,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  subText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
    buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 10,
    flexWrap: 'wrap', 
  },
  addButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 8, 
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 3,
    minWidth: 70, 
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14, 
  },


  logItem: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 8,
    width: '95%', 
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logText: {
    fontSize: 17,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
