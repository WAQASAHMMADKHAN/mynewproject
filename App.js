import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Yup from 'yup';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import InputField from './Feildinput.js'; 
import HomeScreen from './Home.js'; 
import ProfileScreen from './Profile.js'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function MainTabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="HomeTab" 
            screenOptions={{
                headerShown: false, 
                tabBarActiveTintColor: '#007BFF', 
                tabBarStyle: { height: 60, paddingBottom: 5 } 
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size} />
                    ),
                }}
            />
               <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            /> 
        </Tab.Navigator>
    );
}

function AuthLoginScreen({ navigation }) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    
    const LoginSchema = Yup.object().shape({
        email: Yup.string().email('Invalid email address').required('Email is required'),
        password: Yup.string()
            .min(10, 'Password must be at least 10 characters long.')
            .matches(/[0-9]/, 'Password must contain at least one number.')
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
            .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character.')
            .required('Password is required'),
    });
    const handleLogin = async () => {
        setErrors({});
        const values = { email, password };

        try {
            await LoginSchema.validate(values, { abortEarly: false });
            navigation.navigate('MainTabs'); 

        } catch (validationErrors) {
            const newErrors = {};
            validationErrors.inner.forEach(error => {
                newErrors[error.path] = error.message;
            });
            setErrors(newErrors);
            Alert.alert('Login Failed', 'Please check your inputs.');
        }
    };
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                <Text style={styles.title}> Login Screen </Text>
                <View style={styles.formContent}>
                    <InputField
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        error={errors.email}
                        iconName="mail" 
                    />
                    <InputField
                        label="Password"
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        error={errors.password}
                        hintText="(Minimum 10 chars, 1 Cap, 1 Num, 1 Special Char required)"
                        iconName="lock" 
                    />
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleLogin} 
                    >
                        <Text style={styles.buttonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Login" 
                screenOptions={{
                    headerStyle: { backgroundColor: '#007BFF' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen 
                    name="Login" 
                    component={AuthLoginScreen} 
                    options={{ title: 'User Login' }}
                />
                <Stack.Screen 
                    name="MainTabs" 
                    component={MainTabNavigator} 
                    options={({ navigation }) => ({ 
                        headerShown: false, 
                    })} 
                />
                
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1, 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    container: {
        padding: 30,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#333',
    },
    formContent: {
        width: '100%',
        maxWidth: 400,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});