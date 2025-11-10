import React, { useEffect, useMemo, useState } from 'react'; 
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux'; 
import { fetchPosDevicesAsync } from './redux/dataSlice';

const DeviceItem = ({ device }) => {
    const statusColor = device.status === 'Online' ? '#28a745' : '#dc3545';
    const statusText = device.status || 'N/A';

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.deviceName}>{device.name || 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{statusText}</Text>
                </View>
            </View>
            <Text style={styles.detailText}>IP Address: {device.ip || 'N/A'}</Text>
            <Text style={styles.detailText}>Login At: {device.loginTime || 'N/A'}</Text>
            <Text style={styles.detailText}>Active Orders: {device.activeOrders || 0}</Text>
            <Text style={styles.detailText}>Unsynced Orders: {device.unsyncedOrders || 0}</Text>
        </View>
    );
};
const DeviceListScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { deviceType } = route.params || {}; 
    const posDevices = useSelector((state) => state.data.posDevices);
    const isLoadingDevices = useSelector((state) => state.data.isLoadingDevices);
    const errorDevices = useSelector((state) => state.data.errorDevices);

    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        if (!isLoadingDevices && (!posDevices || posDevices.length === 0)) {
            dispatch(fetchPosDevicesAsync());
        }
        if (errorDevices) {
            Alert.alert("Error", `Failed to load devices: ${errorDevices}`);
        }
    }, [dispatch, isLoadingDevices, posDevices, errorDevices]);
    const filteredDevices = useMemo(() => {
       
        const devicesArray = Array.isArray(posDevices) ? posDevices : []; 

        return devicesArray
            .filter((device) => {
                if (deviceType && deviceType !== 'All' && device.status !== deviceType) {
                    return false;
                }
                if (searchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    const deviceName = device.name?.toLowerCase() || '';
                    const deviceIP = device.ip?.toLowerCase() || '';

                    return deviceName.includes(searchLower) || deviceIP.includes(searchLower);
                }

                return true;
            });
    }, [posDevices, deviceType, searchQuery]);
    if (isLoadingDevices && filteredDevices.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading Devices...</Text>
            </View>
        );
    }
    const TitleBar = () => (
        <View style={styles.titleBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back-outline" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>
                {deviceType && deviceType !== 'All' ? `${deviceType} Devices` : 'All Devices'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TitleBar />
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by Name or IP"
                        placeholderTextColor="#a0a0a0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>


                {errorDevices && !isLoadingDevices ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning-outline" size={30} color="#dc3545" />
                        <Text style={styles.errorText}>Error: {errorDevices}</Text>
                        <TouchableOpacity 
                            style={styles.retryButton} 
                            onPress={() => dispatch(fetchPosDevicesAsync())}
                        >
                            <Text style={styles.retryButtonText}>Retry Loading</Text>
                        </TouchableOpacity>
                    </View>
                ) : 
                
                /* Empty State */
                filteredDevices.length === 0 && !isLoadingDevices ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="information-circle-outline" size={40} color="#6c757d" />
                        <Text style={styles.emptyText}>No devices found{deviceType !== 'All' ? ` for ${deviceType}` : ''}.</Text>
                    </View>
                ) : (
                    /* Data List */
                    <FlatList
                        data={filteredDevices}
                        renderItem={({ item }) => <DeviceItem device={item} />}
                        keyExtractor={item => item.id || item.ip || item.name || Math.random().toString()} 
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    titleBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    backButton: { 
        marginRight: 15 
    },
    screenTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#333' 
    },

    // Search
    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        borderRadius: 8,
        margin: 10,
        paddingHorizontal: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 5,
    },

    // List
    listContent: { 
        padding: 10 
    },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        padding: 15, 
        marginBottom: 10, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 2, 
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 5, 
    },
    deviceName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#007BFF' 
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 3, 
        borderRadius: 15, 
    },
    detailText: { 
        fontSize: 14, 
        color: '#666', 
        marginTop: 3 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 15,
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
    },
});

export default DeviceListScreen;