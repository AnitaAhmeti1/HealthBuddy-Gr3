import React from 'react';
import { View, Text, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Përshëndetje nga React Native 👋</Text>

      <Link href="/waterRemainder" style={styles.link}>
        Hap WaterRemainder.jsx 🔗
      </Link>
      
      <Link href="/login" style={styles.link}>
        Hap Login.jsx 🔗
      </Link>
      
      <Link href="/profile" style={styles.link}>
        Hap profile.jsx 🔗
      </Link>
      <Link href="/register" style={styles.link}>
        Hap Register.jsx 🔗
      </Link>
      <Link href="/home" style={styles.link}>
        Hap Home.jsx 🔗
      </Link>
       <Link href="/BloodPressureScreen" style={styles.link}>
        Hap BloodPressure.jsx 🔗
      </Link>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e8b57',
  },
  link: {
    marginTop: 15,
    fontSize: 18,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
