// app/profile.jsx (or wherever you have the file)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    email: '',
    memberSince: '',
    uid: null,
  });

  const [avatarUri, setAvatarUri] = useState(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const [quickStats, setQuickStats] = useState([
    { icon: 'water-outline', color: '#00BFFF', label: 'Water Today', value: '0L' },
    { icon: 'walk-outline', color: '#32CD32', label: 'Steps', value: '0' },
    { icon: 'heart-outline', color: '#FF6347', label: 'Heart Rate', value: '-- bpm' },
    { icon: 'bed-outline', color: '#6A5ACD', label: 'Sleep', value: '0h' },
  ]);

  // when user changes / logs in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || 'No Name',
          email: currentUser.email,
          memberSince: currentUser.metadata?.creationTime
            ? new Date(currentUser.metadata.creationTime).getFullYear()
            : '2024',
          uid: currentUser.uid,
        });
        // save lastUID
        await AsyncStorage.setItem('lastUID', currentUser.uid);
        // load local avatar if exists
        loadAvatar(currentUser.uid, currentUser.photoURL);
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // load statistics
  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadAvatar = async (uid, fallbackPhotoURL) => {
    if (!uid) return;
    setLoadingAvatar(true);
    try {
      const saved = await AsyncStorage.getItem(`avatar_${uid}`);
      if (saved) {
        setAvatarUri(saved);
      } else if (fallbackPhotoURL) {
        // if Firebase has photoURL
        setAvatarUri(fallbackPhotoURL);
      } else {
        setAvatarUri(null);
      }
    } catch (e) {
      console.log('Error loading avatar', e);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const persistAvatar = async (uid, uri) => {
    try {
      await AsyncStorage.setItem(`avatar_${uid}`, uri);
    } catch (e) {
      console.log('Error saving avatar to AsyncStorage', e);
    }
  };

  // Choose from gallery
  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to photos/gallery.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        aspect: [1, 1],
      });

      if (!result.cancelled && result.uri) {
        await applyAvatar(result.uri);
      }
    } catch (e) {
      console.log('pickImage error', e);
      Alert.alert('Error', 'Failed to open gallery.');
    }
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
        aspect: [1, 1],
      });
      if (!result.cancelled && result.uri) {
        await applyAvatar(result.uri);
      }
    } catch (e) {
      console.log('camera error', e);
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  // apply avatar: save locally + updateProfile
  const applyAvatar = async (uri) => {
    const uid = user.uid || auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'User not found.');
      return;
    }
    try {
      setLoadingAvatar(true);
      // 1) save locally
      await persistAvatar(uid, uri);
      setAvatarUri(uri);

      // 2) update Firebase Auth (photoURL) - optional, but nice to have
      try {
        await updateProfile(auth.currentUser, { photoURL: uri });
      } catch (err) {
        // may not be allowed for web in some setups; don't block user
        console.log('updateProfile(photoURL) error', err);
      }

      Alert.alert('Success', 'Avatar updated.');
    } catch (e) {
      console.log('applyAvatar error', e);
      Alert.alert('Error', 'Failed to save avatar.');
    } finally {
      setLoadingAvatar(false);
    }
  };

  // remove local avatar and from Firebase Auth
  const removeAvatar = async () => {
    const uid = user.uid || auth.currentUser?.uid;
    if (!uid) return;
    Alert.alert('Confirm', 'Do you want to delete your avatar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoadingAvatar(true);
            await AsyncStorage.removeItem(`avatar_${uid}`);
            setAvatarUri(null);
            // update Firebase Auth
            try {
              await updateProfile(auth.currentUser, { photoURL: null });
            } catch (err) {
              console.log('updateProfile remove photoURL err', err);
            }
            Alert.alert('Deleted', 'Avatar successfully deleted.');
          } catch (e) {
            console.log('removeAvatar error', e);
            Alert.alert('Error', 'Failed to delete avatar.');
          } finally {
            setLoadingAvatar(false);
          }
        },
      },
    ]);
  };

  // Avatar selection options: alert with 3 options
  const onPressAvatar = () => {
    Alert.alert('Avatar', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from Gallery', onPress: pickImageFromLibrary },
      { text: 'Take Photo', onPress: takePhotoWithCamera },
    ]);
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const uid = currentUser.uid;
      const today = new Date().toISOString().split('T')[0];

      const waterIntake = await AsyncStorage.getItem(`waterIntake_${uid}`);
      const waterML = waterIntake ? parseInt(JSON.parse(waterIntake)) : 0;
      const waterLiters = (waterML / 1000).toFixed(1);

      let steps = 0;
      const stepsData = await AsyncStorage.getItem(`steps_${uid}`);
      if (stepsData) steps = parseInt(stepsData) || 0;

      const bpRecords = await AsyncStorage.getItem(`bloodPressureRecords_${uid}`);
      let heartRate = '-- bpm';
      if (bpRecords) {
        const records = JSON.parse(bpRecords);
        if (records.length > 0) {
          const latestRecord = records[records.length - 1];
          heartRate = `${latestRecord.pulse} bpm`;
        }
      }

      const sleepSessions = await AsyncStorage.getItem(`sleep.sessions.v1_${uid}`);
      let sleepHours = '0h';
      if (sleepSessions) {
        const sessions = JSON.parse(sleepSessions);
        let totalSleepMinutes = 0;
        const todaySessions = sessions.filter((session) => {
          const sessionDate = new Date(session.startISO).toISOString().split('T')[0];
          return sessionDate === today;
        });
        if (todaySessions.length > 0) {
          todaySessions.forEach((session) => {
            const start = new Date(session.startISO);
            const end = new Date(session.endISO);
            const duration = (end - start) / (1000 * 60);
            totalSleepMinutes += duration;
          });
        }
        const sleepHoursValue = (totalSleepMinutes / 60).toFixed(1);
        sleepHours = `${sleepHoursValue}h`;
      }

      setQuickStats([
        { icon: 'water-outline', color: '#00BFFF', label: 'Water Today', value: `${waterLiters}L` },
        { icon: 'walk-outline', color: '#32CD32', label: 'Steps', value: steps.toLocaleString() },
        { icon: 'heart-outline', color: '#FF6347', label: 'Heart Rate', value: heartRate },
        { icon: 'bed-outline', color: '#6A5ACD', label: 'Sleep', value: sleepHours },
      ]);
    } catch (error) {
      console.log('Error loading today stats:', error);
    }
  };

  const handleEditProfile = () => {
    setNewName(user.name);
    setEditModalVisible(true);
  };

  const saveProfile = async () => {
    if (auth.currentUser && newName.trim()) {
      try {
        await updateProfile(auth.currentUser, { displayName: newName });
        setUser((prev) => ({ ...prev, name: newName }));
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated!');
      } catch (error) {
        console.log('Profile update error:', error);
        Alert.alert('Error', 'Failed to update profile.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('lastUID');
      router.replace('/login');
    } catch (error) {
      console.log('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Try again.');
    }
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
        <TouchableOpacity onPress={onPressAvatar} style={{ alignItems: 'center' }}>
          <View>
            {loadingAvatar ? (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/12225/12225935.png' }}
                style={styles.avatar}
              />
            )}
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.memberSince}>Member since {user.memberSince}</Text>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editButton, { marginLeft: 10, borderColor: '#FF3B30' }]}
            onPress={removeAvatar}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.editButtonText, { color: '#FF3B30' }]}>Remove Avatar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal for name change */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Edit Name</Text>
            <TextInput
              style={modalStyles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginRight: 12 }}>
                <Text style={{ color: '#007AFF', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile}>
                <Text style={{ color: '#007AFF', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  box: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD', paddingTop: 50 },
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
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: '#007AFF' },
  avatarEditIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#007AFF',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  email: { fontSize: 16, color: '#666', marginBottom: 5 },
  memberSince: { fontSize: 14, color: '#999', marginBottom: 15 },
  editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF', backgroundColor: 'transparent' },
  editButtonText: { color: '#007AFF', fontWeight: '600', marginLeft: 6 },
  section: { marginTop: 20, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#007ACC', marginBottom: 15, marginLeft: 5 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2, marginTop: 5 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', marginTop: 10 },
  refreshButtonText: { color: '#007AFF', fontWeight: '600', marginLeft: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF3B30', marginLeft: 8 },
});