import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, logout } from './redux/authSlice.js';
import { clearPosDevices } from './redux/dataSlice.js';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from './Feildinput.js';

const UPDATE_PROFILE_URL = 'http://51.112.221.81:8000/api/auth/update-profile';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.userData);
  const storedEmail = userData?.email;
  const storedPassword = userData?.storedPassword;
  const profileImageUri = userData?.profileImageUri;
  const authToken = userData?.authToken;

  const [name, setName] = useState(userData?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const selectImage = (type) => {
    const options = { mediaType: 'photo', maxWidth: 500, maxHeight: 500, quality: 0.7 };
    const handler = (response) => {
      if (response.assets && response.assets.length > 0) {
        dispatch(updateProfile({ profileImageUri: response.assets[0].uri }));
      }
    };
    type === 'camera' ? launchCamera(options, handler) : launchImageLibrary(options, handler);
  };

  const validate = () => {
    let ok = true;
    const next = {};
    if (newPassword) {
      if (!currentPassword) { next.currentPassword = 'Current password is required to set a new password.'; ok = false; }
      else if (currentPassword !== storedPassword) { next.currentPassword = 'Incorrect current password.'; ok = false; }
      if (newPassword.length < 6) { next.newPassword = 'New password must be at least 6 characters.'; ok = false; }
    } else if (currentPassword) {
      next.newPassword = 'New password cannot be empty if current password is provided.'; ok = false;
    }
    if (!name.trim()) { next.name = 'Name cannot be empty.'; ok = false; }
    setErrors(next);
    return ok;
  };

  const handleUpdateProfile = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const payload = { name };
    if (newPassword && currentPassword === storedPassword) {
      payload.newPassword = newPassword;
      payload.currentPassword = currentPassword;
    }
    try {
      const response = await fetch(UPDATE_PROFILE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        dispatch(updateProfile({ name, newPassword: newPassword || undefined }));
        Alert.alert('Success', 'Profile updated successfully!');
        setCurrentPassword(''); setNewPassword('');
      } else {
        Alert.alert('Update Failed', data.message || 'Failed to update profile. Please try again.');
      }
    } catch (e) {
      console.error('Profile API Error:', e);
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          dispatch(logout());
          dispatch(clearPosDevices()); 
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
          );
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>User Profile</Text>

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() =>
            Alert.alert('Change Photo', 'Choose an option', [
              { text: 'Take Photo', onPress: () => selectImage('camera') },
              { text: 'Choose from Library', onPress: () => selectImage('library') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person-circle-outline" size={80} color="#555" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera-outline" size={20} color="#007BFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.infoText}>Email: {storedEmail || 'N/A'}</Text>

        <View style={styles.formContent}>
          <InputField label="Name" placeholder="Enter your name" value={name} onChangeText={setName} error={errors.name} />
          <Text style={styles.passwordHeader}>Change Password (Optional)</Text>
          <InputField label="Current Password" placeholder="Enter current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} error={errors.currentPassword} />
          <InputField label="New Password" placeholder="Enter new password" secureTextEntry value={newPassword} onChangeText={setNewPassword} error={errors.newPassword} hintText="Password must be at least 6 characters." />

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Update Profile</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.updateButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 30, alignItems: 'center', width: '100%' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  passwordHeader: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
  imageContainer: { marginBottom: 30, position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#007BFF' },
  profileImagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#007BFF' },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 20, padding: 5, borderWidth: 1, borderColor: '#ddd' },
  infoText: { fontSize: 16, color: '#666', marginBottom: 20 },
  formContent: { width: '100%', maxWidth: 400 },
  updateButton: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 30 },
  logoutButton: { backgroundColor: '#dc3545', marginTop: 15, marginBottom: 30 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ProfileScreen;
