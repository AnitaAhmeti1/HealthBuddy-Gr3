import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const BloodPressureScreen = () => {
  const router = useRouter();
  const [systolic, setSystolic] = useState(100);
  const [diastolic, setDiastolic] = useState(70);
  const [pulse, setPulse] = useState(30);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("Normal");
  const [resetModalVisible, setResetModalVisible] = useState(false);

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

  const handleAdd = async () => {
    const today = new Date().toISOString().split("T")[0];
    const newRecord = {
      systolic,
      diastolic,
      pulse,
      date: today,
    };

    let newStatus = "Normal";
    if (systolic > 130 || diastolic > 85) newStatus = "High";
    else if (systolic < 90 || diastolic < 60) newStatus = "Low";
    setStatus(newStatus);

    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    await saveData(updatedRecords);

    checkDailyBadge(newStatus, today);
  };

  const checkDailyBadge = async (status, today) => {
    try {
      const badges = JSON.parse((await AsyncStorage.getItem("badges")) || "{}");

      if (
        status === "Normal" &&
        (!badges.healthyHeartDate || badges.healthyHeartDate !== today)
      ) {
        badges.healthyHeart = true;
        badges.healthyHeartDate = today;
        Alert.alert("💚 Achievement unlocked!", "Healthy BP today!");
      }

      await AsyncStorage.setItem("badges", JSON.stringify(badges));
    } catch (e) {
      console.log("Error saving badges:", e);
    }
  };

  const handleResetData = () => {
    setResetModalVisible(true);
  };

  const confirmReset = async () => {
    try {
      setRecords([]);
      await AsyncStorage.removeItem("bloodPressureRecords");
      setResetModalVisible(false);
      Alert.alert("Success", "All data has been reset!");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to reset data");
    }
  };

  const cancelReset = () => {
    setResetModalVisible(false);
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
            <TouchableOpacity onPress={() => setSystolic((p) => p - 1)}>
              <Text style={styles.arrow}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSystolic((p) => p + 1)}>
              <Text style={styles.arrow}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Diastolic</Text>
          <Text style={styles.value}>{diastolic}</Text>
          <View style={styles.selector}>
            <TouchableOpacity onPress={() => setDiastolic((p) => p - 1)}>
              <Text style={styles.arrow}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDiastolic((p) => p + 1)}>
              <Text style={styles.arrow}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Pulse</Text>
          <Text style={styles.value}>{pulse}</Text>
          <View style={styles.selector}>
            <TouchableOpacity onPress={() => setPulse((p) => p - 1)}>
              <Text style={styles.arrow}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPulse((p) => p + 1)}>
              <Text style={styles.arrow}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

  
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>

      <View style={styles.resultCard}>
        <Text style={styles.resultText}>
          {systolic}/{diastolic} mmHg
        </Text>
        <Text
          style={[
            styles.status,
            status === "Normal"
              ? styles.normal
              : status === "High"
              ? styles.high
              : styles.low,
          ]}
        >
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
        <>
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
          
        
          <TouchableOpacity style={styles.smallResetButton} onPress={handleResetData}>
            <Text style={styles.smallResetButtonText}>Reset Data</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={resetModalVisible}
        onRequestClose={cancelReset}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Data</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete all blood pressure records? 
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelReset}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmReset}>
                <Text style={styles.modalButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default BloodPressureScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e984413f", padding: 16 },
  backButton: { marginBottom: 12, padding: 10, alignSelf: "flex-start" },
  backText: { fontSize: 24, color: "#ff7f00", fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center", marginVertical: 12 },
  inputsContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 16 },
  inputBox: { alignItems: "center", flex: 1 },
  label: { fontSize: 14, color: "#777" },
  value: { fontSize: 22, fontWeight: "bold", marginVertical: 4 },
  selector: { flexDirection: "row", gap: 10 },
  arrow: { fontSize: 22, paddingHorizontal: 10, color: "#ff7f00" },
  addButton: {
    backgroundColor: "#ff7f00",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
  },
 
  smallResetButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginVertical: 10,
    alignSelf: "center",
    width: "40%",
  },
  smallResetButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  resultCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  resultText: { fontSize: 24, fontWeight: "bold" },
  status: { marginTop: 6, fontWeight: "bold", fontSize: 16 },
  normal: { color: "green" },
  high: { color: "red" },
  low: { color: "blue" },
  desc: { marginTop: 8, textAlign: "center", color: "#555" },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#ff4444",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});