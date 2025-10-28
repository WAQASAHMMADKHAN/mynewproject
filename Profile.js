import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native'; 

const ProfileScreen = ({ navigation }) => {
  const handleLogout = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }], 
      })
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      <Button
        title="Logout & Go to Login Page"
        onPress={handleLogout}
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffe6e6' },
  title: { fontSize: 20, marginBottom: 20, color: '#8b0000' },
});

export default ProfileScreen;
