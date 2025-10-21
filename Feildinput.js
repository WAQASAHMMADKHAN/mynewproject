import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
        ]}
        onChangeText={onChangeText}
        value={value}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#a0a0a0"
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        hintText && <Text style={styles.hintText}>{hintText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 15,
    color: '#555',
  },
  input: {
    height: 45,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    color: '#000', 
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 2,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  hintText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 5,
  },
});

export default InputField;