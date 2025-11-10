import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { store, persistor } from './redux/store';
import { useSelector } from 'react-redux';
import AuthLoginScreen from './Login.js'; 
import ProfileScreen from './Profile.js'; 
import HomeScreen from './Home.js'; 
import DeviceListScreen from './DeviceListScreen.js'; 


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={HomeScreen} /> 
        <Stack.Screen name="DeviceList" component={DeviceListScreen} /> 
    </Stack.Navigator>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};
const RootNavigator = () => {

    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const initialRouteName = isLoggedIn ? 'MainTabs' : 'Login'; 

    return (
        <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName={initialRouteName} 
        >
            <Stack.Screen name="Login" component={AuthLoginScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} /> 
        </Stack.Navigator>
    );
};
const App = () => {
  return (
    <Provider store={store}> 
      <PersistGate 
        loading={<View style={localStyles.loaderContainer}><ActivityIndicator size="large" color="#007BFF" /></View>} 
        persistor={persistor}
      >
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

const localStyles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default App;