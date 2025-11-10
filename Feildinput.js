import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; 

const InputField = ({ 
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
  error,
  hintText,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); 

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
    
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}> 
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            secureTextEntry && styles.inputWithIcon 
          ]}
          onChangeText={onChangeText}
          value={value}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !isPasswordVisible} 
          placeholderTextColor="#a0a0a0"
        />
        {secureTextEntry && (
            <TouchableOpacity 
                style={styles.toggleButton} 
                onPress={handleTogglePassword}
            >
                <Ionicons 
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={24} 
                    color="#555" 
                />
            </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        hintText && <Text style={styles.hintText}>{hintText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: { width: '100%', marginBottom: 10, },
  label: { fontSize: 16, marginBottom: 5, marginTop: 15, color: '#555', },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', position: 'relative', },
  input: { height: 45, width: '100%', borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, backgroundColor: 'white', color: '#000', },
  inputWithIcon: { paddingRight: 50, }, 
  inputError: { borderColor: '#dc3545', borderWidth: 2, },
  errorText: { color: '#dc3545', fontSize: 14, marginTop: 5, },
  hintText: { color: '#6c757d', fontSize: 12, marginTop: 5, },
  toggleButton: { position: 'absolute', right: 10, padding: 5, },
});

export default InputField;