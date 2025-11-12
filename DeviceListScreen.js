import React, { useEffect, useMemo, useState } from 'react'; 
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux'; 
import { fetchPosDevicesAsync } from './redux/dataSlice';

const toInt = (v) =>
  typeof v === "number"? v: Number.isFinite(parseInt(v, 10))? parseInt(v, 10): 0;

const DeviceItem = ({ device }) => {
 const statusStr = String(device.status ?? '').toLowerCase();
  const isOnline = typeof device.status === 'boolean'
    ? device.status
    : (statusStr === 'online' || statusStr === 'connected' || statusStr === 'active');
  const statusColor = isOnline ? '#28a745' : '#dc3545';
  const statusText = isOnline ? 'Online' : 'Offline';

  const fmtDate = (v) => {
    if (!v) return 'N/A';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(v);
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch { return String(v); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.deviceName}>{device.name || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{statusText}</Text>
        </View>
      </View>
     
      <Text style={styles.detailText}>IP Address: {device.ip || 'N/A'}</Text> 
      
      <Text style={styles.detailText}>Login At: {fmtDate(device.loginTime)}</Text> 
      
      <Text style={styles.detailText}>Active Orders: {toInt(device.activeOrders)}</Text>
     <Text style={styles.detailText}>Inactive Orders: {toInt(device.inActiveOrders)}</Text>
    
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
        
        const mapDevice = (d, idx) => ({
            id: d?.id ?? d?._id ?? d?.uuid ?? d?.code ?? `${d?.ip || d?.ip_address || 'dev'}-${idx}`,
            name: d?.name ?? d?.device_name ?? d?.title ?? 'Unnamed',
            
         
            ip: d?.ipAddress ?? d?.ip ?? d?.device_ip ?? d?.network_ip ?? d?.ip_v4 ?? '',
            
            
            loginTime: d?.lastLoggedInAt ?? d?.last_connected ?? d?.loginTime ?? d?.login_at ?? d?.last_login ?? d?.last_seen ?? d?.last_activity ?? null,
            activeOrders: toInt(d?.activeOrdersCount ?? d?.activeOrders ?? d?.ordersActive ?? d?.orders_active ?? d?.active_orders_count ?? d?.orders?.active ?? 0), 
            inActiveOrders: toInt(d?.unsyncOrdersCount ?? d?.inactiveOrders ?? d?.ordersInactive ?? d?.orders_inactive ?? d?.inactive_orders_count ?? d?.orders?.inactive ?? 0),
            unsyncedOrders: d?.unsyncedOrders ?? d?.unsynced ?? d?.unsynced_count ?? d?.pending_sync ?? 0,
            
            status: (()=>{
                if (typeof d?.is_online === 'boolean') return d.is_online;
                if (typeof d?.isOnline === 'boolean') return d.isOnline;
                if (typeof d?.online === 'boolean') return d.online;
                if (typeof d?.connected === 'boolean') return d.connected;
                if (typeof d?.isConnected === 'boolean') return d.isConnected;

                if (typeof d?.online === 'number') return d.online === 1;
                if (typeof d?.is_online === 'number') return d.is_online === 1;

                const s = String(
                    d?.status ?? d?.device_status ?? d?.connection_status ?? d?.online_status ?? d?.state ?? ''
                ).toLowerCase().trim();
                if (['online','connected','up','active'].includes(s)) return 'online';
                if (['offline','disconnected','down','inactive'].includes(s)) return 'offline';

                const ts =
                    d?.lastPing ?? d?.last_ping ??
                    d?.lastSeen ?? d?.last_seen ??
                    d?.lastHeartbeat ?? d?.last_heartbeat ??
                    d?.seenAt ?? d?.updatedAt ?? d?.updated_at ?? null;
                if (ts) {
                    const t = new Date(ts).getTime();
                    if (Number.isFinite(t) && (Date.now() - t) <= 5*60*1000) return 'online';
                }

                return 'offline';
            })(),
        });

        const normalized = devicesArray.map(mapDevice);
        const type = String(deviceType ?? 'All').toLowerCase();
        const byType = type === 'all'
            ? normalized
            : normalized.filter(d => {
                const st = typeof d.status === 'boolean' ? (d.status ? 'online' : 'offline') : String(d.status).toLowerCase();
                return st === type;
            });

        if (!searchQuery) return byType;
        const q = searchQuery.toLowerCase();
        return byType.filter(d =>
            (d.name || '').toLowerCase().includes(q) ||
            (d.ip || '').toLowerCase().includes(q)
        );
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
                {deviceType && String(deviceType).toLowerCase() !== 'all'
   ? `${deviceType} Devices`
                    : 'All Devices'}
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
                filteredDevices.length === 0 && !isLoadingDevices ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="information-circle-outline" size={40} color="#6c757d" />
                        <Text style={styles.emptyText}>No devices found{deviceType !== 'All' ? ` for ${deviceType}` : ''}.</Text>
                    </View>
                ) : (
                    
                    <FlatList
                        data={filteredDevices}
                        renderItem={({ item }) => <DeviceItem device={item} />}
                        keyExtractor={(item, index) => String(item.id || item.ip || `${item.name}-${index}`)} 
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