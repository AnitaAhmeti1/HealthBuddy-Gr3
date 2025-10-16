import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const BloodPressureScreen = () => {
  const router = useRouter(); // <-- router për navigation

  const [systolic, setSystolic] = useState(100);
  const [diastolic, setDiastolic] = useState(70);
  const [pulse, setPulse] = useState(30);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("Normal");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const json = await AsyncStorage.getItem("bloodPressureRecords");
      if (json) setRecords(JSON.parse(json));
    } catch (error) {
      console.log(error);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem("bloodPressureRecords", JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = () => {
    const newRecord = {
      systolic,
      diastolic,
      pulse,
      date: new Date().toISOString().split("T")[0],
    };

    let newStatus = "Normal";
    if (systolic > 130 || diastolic > 85) newStatus = "High";
    else if (systolic < 90 || diastolic < 60) newStatus = "Low";
    setStatus(newStatus);

    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    saveData(updatedRecords);
  };

  const chartData = {
    labels: records.map((r) => r.date.slice(5)),
    datasets: [
      { data: records.map((r) => r.systolic), color: () => "rgba(255, 99, 132, 1)" },
      { data: records.map((r) => r.diastolic), color: () => "rgba(54, 162, 235, 1)" },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      {/* ← Back Button */}

<TouchableOpacity
  onPress={() => router.push("/(tabs)/home")}
  style={styles.backButton}
>
  <Text style={styles.backText}>←</Text>
</TouchableOpacity>


      <Text style={styles.title}>Blood Pressure</Text>

      <View style={styles.inputsContainer}>
        <View style={styles.inputBox}>
          <Text style={styles.label}>Systolic</Text>
          <Text style={styles.value}>{systolic}</Text>
          <View style={styles.selector}>
            <TouchableOpacity onPress={() => setSystolic((prev) => prev - 1)}><Text style={styles.arrow}>-</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSystolic((prev) => prev + 1)}><Text style={styles.arrow}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Diastolic</Text>
          <Text style={styles.value}>{diastolic}</Text>
          <View style={styles.selector}>
            <TouchableOpacity onPress={() => setDiastolic((prev) => prev - 1)}><Text style={styles.arrow}>-</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setDiastolic((prev) => prev + 1)}><Text style={styles.arrow}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Pulse</Text>
          <Text style={styles.value}>{pulse}</Text>
          <View style={styles.selector}>
            <TouchableOpacity onPress={() => setPulse((prev) => prev - 1)}><Text style={styles.arrow}>-</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setPulse((prev) => prev + 1)}><Text style={styles.arrow}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>

      <View style={styles.resultCard}>
        <Text style={styles.resultText}>{systolic}/{diastolic} mmHg</Text>
        <Text style={[styles.status, 
          status === "Normal" ? styles.normal : status === "High" ? styles.high : styles.low
        ]}>
          {status}
        </Text>
        <Text style={styles.desc}>
          {status === "Normal"
            ? "Normal blood pressure. Manage stress and stay healthy."
            : status === "High"
            ? "High pressure. Reduce stress and monitor regularly."
            : "Low pressure. Stay hydrated and rest properly."}
        </Text>
      </View>

      {records.length > 0 && (
        <BarChart
          data={chartData}
          width={screenWidth - 20}
          height={220}
          fromZero
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#f6f6f6",
            backgroundGradientTo: "#f6f6f6",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: () => "#666",
          }}
          style={{ marginVertical: 8, borderRadius: 12 }}
        />
      )}
    </ScrollView>
  );
};

export default BloodPressureScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e984413f", padding: 16 },
  backButton: { 
  marginBottom: 12, 
  padding: 10, 
  alignSelf: "flex-start" 
},
backText: { 
  fontSize: 24, 
  color:  "#ff7f00", 
  fontWeight: "bold" 
},

  title: { fontSize: 22, fontWeight: "600", textAlign: "center", marginVertical: 12 },
  inputsContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 16 },
  inputBox: { alignItems: "center", flex: 1 },
  label: { fontSize: 14, color: "#777" },
  value: { fontSize: 22, fontWeight: "bold", marginVertical: 4 },
  selector: { flexDirection: "row", gap: 10 },
  arrow: { fontSize: 22, paddingHorizontal: 10, color: "#ff7f00" },
  button: { backgroundColor: "#ff7f00", borderRadius: 10, padding: 12, alignItems: "center", marginVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  resultCard: { backgroundColor: "#f9f9f9", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 },
  resultText: { fontSize: 24, fontWeight: "bold" },
  status: { marginTop: 6, fontWeight: "bold", fontSize: 16 },
  normal: { color: "green" },
  high: { color: "red" },
  low: { color: "blue" },
  desc: { marginTop: 8, textAlign: "center", color: "#555" },
});
