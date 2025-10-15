import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import LoginForm from '@/components/LoginForm'; // Përdorim @/ alias

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = (username: string, password: string) => {
    if (username === 'user' && password === 'password') {
      Alert.alert('Sukses', 'Login i suksesshëm!');
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Gabim', 'Username ose password i gabuar!');
    }
  };

  return (
    <View style={styles.container}>
      <LoginForm onLogin={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
});