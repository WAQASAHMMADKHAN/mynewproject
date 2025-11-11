import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { setPosDevices } from './redux/dataSlice'; 
import axios from "axios";
import { fetchPosDevicesAsync } from './redux/dataSlice';
const POS_DEVICES_URL = 'http://51.112.221.81:8000/api/pos-devices/fetchPosDevices'; 

const screenWidth = Dimensions.get('window').width;
const DashboardCard = ({ title, count, icon, color, onPress }) => (
    <TouchableOpacity 
        style={[styles.card, { borderLeftColor: color, backgroundColor: '#fff' }]} 
        onPress={onPress}
        disabled={!onPress} 
    >
        <Ionicons name={icon} size={35} color={color} style={styles.icon} />
        <View style={styles.textContainer}>
            <Text style={styles.countText}>{count}</Text>
            <Text style={styles.titleText}>{title}</Text>
        </View>
    </TouchableOpacity>
);


const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.auth.userData);
    const posDevices = useSelector((state) => state.data.posDevices);
    console.log(posDevices,"posDevicesposDevicesposDevices");
    
    const authToken = userData?.authToken;
    const userName = userData?.name || 'User';

    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardMetrics, setDashboardMetrics] = useState({
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        activeOrders: 0,
        inActiveOrders: 0,
    });

    const calculateMetrics = useCallback((devices) => {
        const online = devices.filter(d => d.status === 'Online').length;
        const offline = devices.length - online;
        const activeOrders = devices.reduce((sum, d) => sum + (d.activeOrdersCount || d.activeOrders || 0), 0);
        const inActiveOrders = devices.reduce((sum, d) => sum + (d.inActiveOrders || 0), 0); 

        setDashboardMetrics({
            totalDevices: devices.length,
            onlineDevices: online,
            offlineDevices: offline,
            activeOrders: activeOrders,
            inActiveOrders: inActiveOrders,
        });
    }, []);

    const fetchPosDevices = async (showLoading = true) => {

        showLoading && setIsLoading(true);
        
        try {

            const response = await axios.get(POS_DEVICES_URL);
            console.log(response?.data?.data,);

            dispatch(setPosDevices(response?.data?.data || []));

            // const data = await response.json();

            // if (response.ok && Array.isArray(data.devices)) {
            //     dispatch(setPosDevices(data.devices));
            //     // calculateMetrics(data.devices);

            // } else {
            //     const errorMessage = data.message || "Failed to fetch device data.";
            //     Alert.alert("Data Error", errorMessage);
            //     dispatch(setPosDevices([])); 
            //     // calculateMetrics([]);
            // }

        } catch (error) {
            console.error("Home API Error:", error);
            Alert.alert("Network Error", "Could not connect to the POS server.");
            dispatch(setPosDevices([])); 
            // calculateMetrics([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }; 

    useEffect(() => {
        fetchPosDevices(); 
    }, []); 
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosDevices(false); 
    }, []);
    const handleNavigation = (deviceType) => {
        navigation.navigate('DeviceList', { deviceType: deviceType });
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={{ marginTop: 10 }}>Loading Dashboard...</Text>
            </View>
        );
    }
    
    return (
        <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {userName}!</Text>
                <Text style={styles.subHeader}>Welcome to your dashboard.</Text>
            </View>

            <View style={styles.grid}>
                <DashboardCard 
                    title="Total Devices" 
                    count={dashboardMetrics.totalDevices} 
                    icon="server-outline"
                    color="#007BFF"
                    onPress={() => handleNavigation('Total')}
                />
                <DashboardCard 
                    title="Online Devices" 
                    count={dashboardMetrics.onlineDevices} 
                    icon="wifi-outline"
                    color="#4CAF50"
                    onPress={() => handleNavigation('Online')}
                />

                <DashboardCard 
                    title="Offline Devices" 
                    count={dashboardMetrics.offlineDevices} 
                    icon="alert-circle-outline"
                    color="#F44336"
                    onPress={() => handleNavigation('Offline')}
                />
                <DashboardCard 
                    title="Active Orders" 
                    count={dashboardMetrics.activeOrders} 
                    icon="receipt-outline"
                    color="#ff9800"
                />
                 <DashboardCard 
                    title="Total Orders" 
                    count={dashboardMetrics.activeOrders + dashboardMetrics.inActiveOrders} 
                    icon="layers-outline"
                    color="#673AB7"
                />
            </View>
            
            <Text style={{ marginTop: 20, color: '#666' }}>Pull down to refresh data.</Text>

        </ScrollView>
    );
};
const styles = StyleSheet.create({
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    scrollView: { flex: 1, backgroundColor: '#f0f4f7' },
    scrollContent: { padding: 10, alignItems: 'center', minHeight: '100%' },
    header: { width: '100%', padding: 15, marginBottom: 10, },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subHeader: { fontSize: 16, color: '#6c757d', marginTop: 5 },
    
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: screenWidth < 500 ? '100%' : 600, 
    },
    card: { 
        width: screenWidth < 500 ? '48.5%' : '32%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 10, 
        borderLeftWidth: 5, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 2, 
    },
    icon: { marginRight: 10 },
    textContainer: { flex: 1 },
    countText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    titleText: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default HomeScreen;