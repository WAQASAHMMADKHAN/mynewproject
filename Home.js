import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { setPosDevices } from './redux/dataSlice'; 
import axios from "axios";
const POS_DEVICES_URL = 'http://3.29.1.212:8000/api/pos-devices/fetchPosDevices'; 

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
        totalOrders: 0,
    });
const toInt = (v) =>
  typeof v === "number"
    ? v
    : Number.isFinite(parseInt(v, 10))
    ? parseInt(v, 10)
    : 0;
const isOnlineFrom = (d) => {
  if (typeof d?.is_online === 'boolean') return d.is_online;
  if (typeof d?.online === 'boolean') return d.online;
  if (typeof d?.connected === 'boolean') return d.connected;
  if (typeof d?.isConnected === 'boolean') return d.isConnected;
  if (typeof d?.online === 'number') return d.online === 1;
  if (typeof d?.is_online === 'number') return d.is_online === 1;

  const s = String(d?.status ?? d?.device_status ?? d?.connection_status ?? d?.online_status ?? '').toLowerCase().trim();
  if (['online','connected','up','active'].includes(s)) return true;
  if (['offline','disconnected','down','inactive'].includes(s)) return false;

  const ts = d?.lastPing ?? d?.last_ping ?? d?.lastSeen ?? d?.last_seen ?? d?.lastHeartbeat ?? d?.last_heartbeat ?? d?.updatedAt ?? d?.updated_at;
  if (ts) {
    const t = new Date(ts).getTime();
    if (Number.isFinite(t)) return (Date.now() - t) <= 5*60*1000;
  }
  return false;
};
const calculateMetrics = React.useCallback((devices = []) => {
  const list = Array.isArray(devices) ? devices : [];

  const online = list.reduce((sum, d) => sum + (isOnlineFrom(d) ? 1 : 0), 0);
  const offline = list.length - online;
  const activeOrders = list.reduce((sum, d) => sum + toInt(
      d?.activeOrdersCount ??         
      d?.activeOrders ??              
      d?.ordersActive ??            
      d?.orders_active ??            
      d?.active_orders_count ??       
      d?.orders?.active ??            
      0
  ), 0);
  const inActiveOrders = list.reduce((sum, d) => sum + toInt(
      d?.unsyncOrdersCount ?? 
      d?.unsyncOrdersCount ?? 
      d?.unsyncOrdersCount?? 
      d?.unsyncOrdersCount ?? 
      d?.unsyncOrdersCount ?? 
      d?.unsyncOrdersCount ??           
      0
  ), 0);
  
  const totalOrders = activeOrders + inActiveOrders;

  setDashboardMetrics({
    totalDevices: list.length,
    onlineDevices: online,
    offlineDevices: offline,
    activeOrders,
    inActiveOrders,
    totalOrders,
  });
}, []);

    const fetchPosDevices = async (showLoading = true) => {
        showLoading && setIsLoading(true);
        
        try {
             const response = await axios.get(POS_DEVICES_URL, {
                 headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
             });
             const arr = Array.isArray(response?.data)
            ? response.data
            : (response?.data?.devices ?? response?.data?.data ?? response?.data?.items ?? response?.data ?? []); 
            
            const devices = Array.isArray(arr) ? arr : [];
            dispatch(setPosDevices(devices));
            calculateMetrics(devices);
           
        }catch (error) {
            console.error("Home API Error:", error.response ? error.response.data : error.message);
            Alert.alert("Network Error", "Could not connect to the POS server or failed to authenticate.");
            dispatch(setPosDevices([])); 
            calculateMetrics([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }; 

    useEffect(() => { 
        if (authToken) {
            fetchPosDevices(); 
        } else {
             Alert.alert("Authentication Error", "Please log in again to fetch devices.");
        }
    }, [authToken]); 
    
    useEffect(() => {
        if (Array.isArray(posDevices)) {
            calculateMetrics(posDevices);
        }
    }, [posDevices, calculateMetrics]);
    
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosDevices(false); 
    }, [authToken]); 
    
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
                <Text style={styles.greeting}>Home Screen</Text>
                <Text style={styles.subHeader}>Welcome to your dashboard, {userName}.</Text>
            </View>

            <View style={styles.grid}>
                {/* Devices */}
                <DashboardCard 
                    title="Total Devices" 
                    count={dashboardMetrics.totalDevices} 
                    icon="server-outline"
                    color="#007BFF"
                    onPress={() => handleNavigation('All')}
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
                    title="Inactive Orders" 
                    count={dashboardMetrics.inActiveOrders} 
                    icon="remove-circle-outline"
                    color="#9e9e9e" 
                />
                 <DashboardCard 
                    title="Total Orders" 
                    count={dashboardMetrics.totalOrders} 
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