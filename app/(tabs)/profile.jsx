import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    memberSince: '2024',
  });

  const [quickStats, setQuickStats] = useState([
    { icon: 'water-outline', color: '#00BFFF', label: 'Water Today', value: '0L' },
    { icon: 'walk-outline', color: '#32CD32', label: 'Steps', value: '0' },
    { icon: 'heart-outline', color: '#FF6347', label: 'Heart Rate', value: '-- bpm' },
    { icon: 'bed-outline', color: '#6A5ACD', label: 'Sleep', value: '0h' },
  ]);

  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const waterIntake = await AsyncStorage.getItem('waterIntake');
      const waterML = waterIntake ? parseInt(JSON.parse(waterIntake)) : 0;
      const waterLiters = (waterML / 1000).toFixed(1);
      
      let steps = 0;
      const stepsData = await AsyncStorage.getItem('stepsData');
      if (stepsData) {
        const parsed = JSON.parse(stepsData);
        steps = parsed.steps || 0;
      } else {
        steps = 0;
      }
      
      const bpRecords = await AsyncStorage.getItem('bloodPressureRecords');
      let heartRate = '-- bpm';
      if (bpRecords) {
        const records = JSON.parse(bpRecords);
        if (records.length > 0) {
          const latestRecord = records[records.length - 1];
          heartRate = `${latestRecord.pulse} bpm`;
        }
      }
      
      const sleepSessions = await AsyncStorage.getItem('sleep.sessions.v1');
      let sleepHours = '0h';
      if (sleepSessions) {
        const sessions = JSON.parse(sleepSessions);
        const todaySessions = sessions.filter(session => {
          const sessionDate = new Date(session.startISO).toISOString().split('T')[0];
          return sessionDate === today;
        });
        
        if (todaySessions.length > 0) {
          let totalSleepMinutes = 0;
          todaySessions.forEach(session => {
            const start = new Date(session.startISO);
            const end = new Date(session.endISO);
            const duration = (end - start) / (1000 * 60);
            totalSleepMinutes += duration;
          });
          
          const sleepHoursValue = (totalSleepMinutes / 60).toFixed(1);
          sleepHours = `${sleepHoursValue}h`;
        } else {
          if (sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            const start = new Date(lastSession.startISO);
            const end = new Date(lastSession.endISO);
            const duration = (end - start) / (1000 * 60);
            const sleepHoursValue = (duration / 60).toFixed(1);
            sleepHours = `${sleepHoursValue}h`;
          }
        }
      }

      setQuickStats([
        { icon: 'water-outline', color: '#00BFFF', label: 'Water Today', value: `${waterLiters}L` },
        { icon: 'walk-outline', color: '#32CD32', label: 'Steps', value: steps.toLocaleString() },
        { icon: 'heart-outline', color: '#FF6347', label: 'Heart Rate', value: heartRate },
        { icon: 'bed-outline', color: '#6A5ACD', label: 'Sleep', value: sleepHours },
      ]);

    } catch (error) {
      console.log('Error loading today stats:', error);
      setQuickStats([
        { icon: 'water-outline', color: '#00BFFF', label: 'Water Today', value: '0L' },
        { icon: 'walk-outline', color: '#32CD32', label: 'Steps', value: '0' },
        { icon: 'heart-outline', color: '#FF6347', label: 'Heart Rate', value: '-- bpm' },
        { icon: 'bed-outline', color: '#6A5ACD', label: 'Sleep', value: '0h' },
      ]);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality will be added soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            Alert.alert('Logged Out', 'You have been logged out.');
            router.replace('/login');
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadTodayStats();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={16} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Ionicons name={stat.icon} size={32} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadTodayStats}>
          <Ionicons name="refresh-outline" size={16} color="#007AFF" />
          <Text style={styles.refreshButtonText}>Refresh Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/badgesScreen')}>
          <View style={styles.menuLeft}>
            <Ionicons name="trophy" size={22} color="#FFD700" />
            <Text style={styles.menuText}>My Achievements</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="notifications" size={22} color="#007AFF" />
            <Text style={styles.menuText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="shield-checkmark" size={22} color="#4CAF50" />
            <Text style={styles.menuText}>Privacy & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle" size={22} color="#FF9800" />
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007ACC',
    marginBottom: 15,
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
});
