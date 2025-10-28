import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
const LoginScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Page</Text>
      <Button
        title="Go to Tabs (Login Successful)"
        onPress={() => navigation.navigate('MainTabs')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  title: { fontSize: 24, marginBottom: 20 },
});

export default LoginScreen;