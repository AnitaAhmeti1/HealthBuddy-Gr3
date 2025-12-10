// app/profile.jsx
// FIXED: Image picker now works on both mobile and web
// - Handles blob URIs on web by converting to base64
// - Handles file URIs on mobile properly
// - Added proper error handling for all platforms
// - Permission handling for camera and gallery

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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

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

  // Clean up any blob URIs on mount (one-time cleanup)
  useEffect(() => {
    const cleanupBlobURIs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          const saved = await AsyncStorage.getItem(`avatar_${uid}`);
          if (saved && saved.startsWith('blob:')) {
            console.log('Cleaning up blob URI from storage...');
            await AsyncStorage.removeItem(`avatar_${uid}`);
          }
        }
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    };
    cleanupBlobURIs();
  }, []);

  const loadAvatar = async (uid, fallbackPhotoURL) => {
    if (!uid) return;
    setLoadingAvatar(true);
    try {
      const saved = await AsyncStorage.getItem(`avatar_${uid}`);
      if (saved) {
        // Check if it's a blob URI (invalid on mobile)
        if (saved.startsWith('blob:')) {
          console.log('Found invalid blob URI, removing...');
          await AsyncStorage.removeItem(`avatar_${uid}`);
          setAvatarUri(null);
        } else {
          // Valid URI (file:// or data:)
          setAvatarUri(saved);
        }
      } else if (fallbackPhotoURL && !fallbackPhotoURL.startsWith('blob:')) {
        // if Firebase has photoURL and it's not a blob
        setAvatarUri(fallbackPhotoURL);
      } else {
        setAvatarUri(null);
      }
    } catch (e) {
      console.log('Error loading avatar', e);
      setAvatarUri(null);
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

  // AVATAR SELECTION MODAL
  const showAvatarOptions = () => {
    setAvatarModalVisible(true);
  };

  // CHOOSE FROM GALLERY
  const pickImageFromGallery = async () => {
    setAvatarModalVisible(false);
    
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'App needs access to your gallery to select photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Platform.OS === 'ios' 
                ? Linking.openURL('app-settings:') 
                : Linking.openSettings() 
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await processAndApplyAvatar(imageUri);
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  // TAKE PHOTO WITH CAMERA
  const takePhotoWithCamera = async () => {
    setAvatarModalVisible(false);
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'App needs access to your camera to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Platform.OS === 'ios' 
                ? Linking.openURL('app-settings:') 
                : Linking.openSettings() 
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await processAndApplyAvatar(imageUri);
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Could not open camera');
    }
  };

  // Process and apply avatar
  const processAndApplyAvatar = async (uri) => {
    try {
      setLoadingAvatar(true);
      
      console.log('Processing image URI:', uri);
      
      // Check if it's a blob URI (happens on web or in some edge cases)
      if (uri.startsWith('blob:')) {
        console.log('Detected blob URI, converting...');
        
        // On web, we need to convert blob to base64
        if (Platform.OS === 'web') {
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onloadend = async () => {
              const base64data = reader.result;
              console.log('Blob converted to base64');
              await applyAvatar(base64data);
            };
            
            reader.onerror = () => {
              throw new Error('Failed to read image');
            };
            
            reader.readAsDataURL(blob);
            return;
          } catch (error) {
            console.log('Blob conversion error:', error);
            throw error;
          }
        } else {
          // On mobile, blob URIs should not occur from ImagePicker
          // but if they do, we cannot process them
          throw new Error('Blob URIs are not supported on mobile. Please try again.');
        }
      }
      
      // Check if it's a valid file URI (mobile)
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        console.log('Valid file URI detected');
        await applyAvatar(uri);
        return;
      }
      
      // Check if it's base64
      if (uri.startsWith('data:')) {
        console.log('Base64 data detected');
        await applyAvatar(uri);
        return;
      }
      
      // If we get here, it's an unknown format
      console.log('Unknown URI format:', uri.substring(0, 50));
      throw new Error('Unsupported image format');
      
    } catch (error) {
      console.log('Process avatar error:', error);
      Alert.alert('Error', error.message || 'Failed to process image. Please try again.');
      setLoadingAvatar(false);
    }
  };

  // APPLY AVATAR
  const applyAvatar = async (uri) => {
    const uid = user.uid || auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'User not found');
      setLoadingAvatar(false);
      return;
    }
    
    try {
      // Validate URI
      if (!uri || uri.trim() === '') {
        throw new Error('Invalid image URI');
      }
      
      // Save locally
      await persistAvatar(uid, uri);
      setAvatarUri(uri);
      
      // Update Firebase Auth (optional, may fail on some platforms)
      try {
        if (auth.currentUser) {
          // Only save file URIs to Firebase, not base64
          const photoURL = uri.startsWith('data:') ? null : uri;
          await updateProfile(auth.currentUser, { photoURL });
        }
      } catch (err) {
        console.log('Note: Could not sync with Firebase (local save successful)', err);
      }
      
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      console.log('applyAvatar error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoadingAvatar(false);
    }
  };

  // REMOVE AVATAR
  const removeAvatar = async () => {
    setAvatarModalVisible(false);
    
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const uid = user.uid || auth.currentUser?.uid;
            if (!uid) return;
            
            try {
              setLoadingAvatar(true);
              await AsyncStorage.removeItem(`avatar_${uid}`);
              setAvatarUri(null);
              
              // Update Firebase Auth
              try {
                if (auth.currentUser) {
                  await updateProfile(auth.currentUser, { photoURL: null });
                }
              } catch (err) {
                console.log('Error removing photoURL from Firebase', err);
              }
              
              Alert.alert('Success', 'Avatar removed successfully');
            } catch (error) {
              console.log('removeAvatar error:', error);
              Alert.alert('Error', 'Failed to remove avatar');
            } finally {
              setLoadingAvatar(false);
            }
          }
        }
      ]
    );
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
        <TouchableOpacity onPress={showAvatarOptions} style={{ alignItems: 'center' }}>
          <View>
            {loadingAvatar ? (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : avatarUri && !avatarUri.startsWith('blob:') ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={styles.avatar}
                onError={(error) => {
                  console.log('Image load error:', error.nativeEvent.error);
                  setAvatarUri(null);
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#007AFF" />
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
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
        </View>
      </View>

      {/* AVATAR OPTIONS MODAL */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity 
          style={modalStyles.overlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <View style={modalStyles.avatarOptionsContainer}>
            <View style={modalStyles.avatarOptionsHeader}>
              <Text style={modalStyles.avatarOptionsTitle}>Profile Picture</Text>
            </View>
            
            <TouchableOpacity 
              style={modalStyles.avatarOption}
              onPress={takePhotoWithCamera}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={modalStyles.avatarOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={modalStyles.avatarOption}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images" size={24} color="#007AFF" />
              <Text style={modalStyles.avatarOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {avatarUri && (
              <TouchableOpacity 
                style={[modalStyles.avatarOption, { borderTopWidth: 1, borderTopColor: '#f0f0f0' }]}
                onPress={removeAvatar}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={[modalStyles.avatarOptionText, { color: '#FF3B30' }]}>
                  Remove Current Picture
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[modalStyles.avatarOption, modalStyles.cancelOption]}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EDIT NAME MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={modalStyles.modalTitle}>Edit Name</Text>
            <TextInput
              style={modalStyles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              autoFocus
            />
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity 
                style={modalStyles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={modalStyles.saveButton}
                onPress={saveProfile}
              >
                <Text style={modalStyles.saveButtonText}>Save</Text>
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

        <TouchableOpacity style={styles.refreshButton} onPress={loadTodayStats}>
          <Ionicons name="refresh-outline" size={16} color="#007AFF" />
          <Text style={styles.refreshButtonText}>Refresh Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {[
          { icon: 'trophy', color: '#FFD700', text: 'My Achievements', screen: '/badgesScreen' },
          { icon: 'notifications', color: '#007AFF', text: 'Notifications' },
          { icon: 'shield-checkmark', color: '#4CAF50', text: 'Privacy & Security' },
          { icon: 'help-circle', color: '#FF9800', text: 'Help & Support' },
        ].map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.menuItem}
            onPress={() => item.screen && router.push(item.screen)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={22} color={item.color} />
              <Text style={styles.menuText}>{item.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
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
  overlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  avatarOptionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  avatarOptionsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 10,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  box: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 20,
    alignSelf: 'center',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#333' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    paddingTop: Platform.OS === 'ios' ? 50 : 30 
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
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 15, 
    borderWidth: 3, 
    borderColor: '#007AFF' 
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 0,
    bottom: 10,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 5 
  },
  email: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 5 
  },
  memberSince: { 
    fontSize: 14, 
    color: '#999', 
    marginBottom: 15 
  },
  editButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#007AFF', 
    backgroundColor: 'transparent' 
  },
  editButtonText: { 
    color: '#007AFF', 
    fontWeight: '600', 
    marginLeft: 6 
  },
  section: { 
    marginTop: 20, 
    paddingHorizontal: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#007ACC', 
    marginBottom: 15, 
    marginLeft: 5 
  },
  statsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
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
    elevation: 2 
  },
  statValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 2, 
    marginTop: 5 
  },
  statLabel: { 
    fontSize: 12, 
    color: '#666', 
    textAlign: 'center' 
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
    marginTop: 10 
  },
  refreshButtonText: { 
    color: '#007AFF', 
    fontWeight: '600', 
    marginLeft: 8 
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
    elevation: 2 
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  menuText: { 
    fontSize: 16, 
    color: '#333', 
    marginLeft: 12, 
    fontWeight: '500' 
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
    elevation: 2 
  },
  logoutText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FF3B30', 
    marginLeft: 8 
  },
});