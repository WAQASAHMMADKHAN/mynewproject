import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { CommonActions } from '@react-navigation/native';
import { loginSuccess } from'./redux/authSlice.js'; 
import InputField from './Feildinput.js'; 

const LOGIN_URL = 'http://51.112.221.81:8000/api/auth/login';

export default function AuthLoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }

    setIsLoading(true);
    
    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ email, password }),
        });
        const responseText = await response.text(); 
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText); 
                const userData = data.user;
                const authToken = data.token ? data.token.trim() : null; 

                const inputPassword = password; 

                dispatch(
                    loginSuccess({
                        email: userData.email,
                        name: userData.name,
                        userId: userData._id || null, 
                        authToken: authToken,
                        password: inputPassword,
                    })
                );

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    })
                );
            } catch (e) {
                console.error("Login JSON Parse Error:", e.message);
                Alert.alert("Login Failed", "Server did not return valid login data. Please check your credentials.");
            }
        } else {
             let errorMessage = "Login failed. Please check credentials or try again.";
             try {
                 const errorData = JSON.parse(responseText);
                 errorMessage = errorData.message || errorMessage;
             } catch (e) {
                 errorMessage = `Login failed: Server Error (${response.status})`;
             }
             Alert.alert("Login Failed", errorMessage);
        }

    } catch (error) {
        console.error("Login Network Error:", error.message);
        Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
        setIsLoading(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <View style={styles.formContent}>
                <InputField
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <InputField
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={true} 
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            <TouchableOpacity 
                style={[styles.button, isLoading && { opacity: 0.7 }]} 
                onPress={onLogin} 
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, justifyContent: 'center', backgroundColor: '#f5f5f5', },
    container: { padding: 30, alignItems: 'center', width: '100%', },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#333', },
    formContent: { width: '100%', maxWidth: 400, },
    button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 30, },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});