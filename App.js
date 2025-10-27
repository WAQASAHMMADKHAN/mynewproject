import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import * as Yup from 'yup';
import InputField from './Feildinput.js'; 

const LoginSchema = Yup.object().shape({
 email: Yup.string()
  .email('Invalid email address') 
  .required('Email is required'),
  
 password: Yup.string()
 .min(10, 'Password must be at least 10 characters long.')
 .matches(/[0-9]/, 'Password must contain at least one number.')
 .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character.')
 .required('Password is required'),
});

export default function App() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [errors, setErrors] = useState({});

 const [isPasswordVisible, setIsPasswordVisible] = useState(false); 

 const handleLogin = async () => {
  setErrors({});
  const values = { email, password };

 try {
 await LoginSchema.validate(values, { abortEarly: false });
   Alert.alert(
   'Login Successful! 🎉',
  `Email: ${email}\nPassword is Validated and Secure.`,
    [{ text: 'OK' }]
   );

 } catch (validationErrors) {
 const newErrors = {};
 validationErrors.inner.forEach(error => {
 newErrors[error.path] = error.message;
 });
 setErrors(newErrors);
 }
 };
 const togglePasswordVisibility = () => {
   setIsPasswordVisible(!isPasswordVisible);
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
          />
      
          
          <View>
            <InputField
                label="Password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible} 
                error={errors.password}
                hintText="(Minimum 10 chars, 1 Cap, 1 Num, 1 Special Char required)"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={togglePasswordVisibility}
            >
              <Icon 
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
          
           <TouchableOpacity 
            style={styles.button} 
             onPress={handleLogin} 
           >
             <Icon 
                name="log-in-outline" 
                size={22} 
                color="white" 
                style={styles.buttonIcon} 
              />
           <Text style={styles.buttonText}>Sign In</Text>
           </TouchableOpacity>
          </View>
         </View>
         </ScrollView>
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
   eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 35, 
    padding: 10,
    zIndex: 1, 
   },
   button: {
    backgroundColor: '#007BFF',
    padding: 15,
     borderRadius: 8,
     width: '100%',
     alignItems: 'center',
     marginTop: 30,
     flexDirection: 'row', 
     justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 10, 
  }
});