import React, { useState, useEffect, useCallback } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,RefreshControl,Alert,ActivityIndicator,Dimensions,Modal,FlatList,} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { setPosDevices } from './redux/dataSlice';

const POS_DEVICES_URL   = 'http://3.29.1.212:8000/api/pos-devices/fetchPosDevices';
const MERCHANTS_URL     = 'http://3.29.1.212:8000/api/merchant/getMerchantsList';
const BRANCHES_URL_BASE = 'http://3.29.1.212:8000/api/branch/all';

const screenWidth = Dimensions.get('window').width;

const DashboardCard = ({ title, count, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: color, backgroundColor: '#fff' }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <Ionicons name={icon} size={35} color={color} style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={styles.countText}>{Number(count) || 0}</Text>
      <Text style={styles.titleText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const userData = useSelector((s) => s.auth.userData);
  const posDevices = useSelector((s) => s.data.posDevices);
  const authToken = userData?.authToken;
  const userName = userData?.name || 'User';

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [pickerOpen, setPickerOpen] = useState({ open: false, type: null });

  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    activeOrders: 0,
    inActiveOrders: 0,
    totalOrders: 0,
  });

  const toInt = (v) =>
    typeof v === 'number' ? v : Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0;

  const getMerchantName = (d) =>
    d?.merchantName ??
    d?.merchant_name ??
    d?.merchant?.name ??
    d?.merchantTitle ??
    d?.merchant ??
    null;

  const getBranchName = (d) =>
    d?.branchName ??
    d?.branch_name ??
    d?.branch?.name ??
    d?.branchTitle ??
    d?.branch ??
    d?.name ??
    null;

  const isOnlineFrom = (d) => {
    if (typeof d?.is_online === 'boolean') return d.is_online;
    if (typeof d?.isOnline === 'boolean') return d.isOnline;
    if (typeof d?.online === 'boolean') return d.online;
    if (typeof d?.connected === 'boolean') return d.connected;
    if (typeof d?.isConnected === 'boolean') return d.isConnected;
    if (typeof d?.online === 'number') return d.online === 1;
    if (typeof d?.is_online === 'number') return d.is_online === 1;

    const s = String(
      d?.status ??
        d?.device_status ??
        d?.connection_status ??
        d?.online_status ??
        d?.state ??
        ''
    )
      .toLowerCase()
      .trim();
    if (['online', 'connected', 'up', 'active'].includes(s)) return true;
    if (['offline', 'disconnected', 'down', 'inactive'].includes(s)) return false;

    const ts =
      d?.lastPing ??
      d?.last_ping ??
      d?.lastSeen ??
      d?.last_seen ??
      d?.lastHeartbeat ??
      d?.last_heartbeat ??
      d?.updatedAt ??
      d?.updated_at;
    if (ts) {
      const t = new Date(ts).getTime();
      if (Number.isFinite(t) && Date.now() - t <= 5 * 60 * 1000) return true;
    }
    return false;
  };

  const calculateMetrics = useCallback((devices = []) => {
    const list = Array.isArray(devices) ? devices : [];
    const online = list.reduce((sum, d) => sum + (isOnlineFrom(d) ? 1 : 0), 0);
    const offline = list.length - online;

    const activeOrders = list.reduce(
      (sum, d) =>
        sum +
        toInt(
          d?.activeOrdersCount ??
            d?.activeOrders ??
            d?.ordersActive ??
            d?.orders_active ??
            d?.active_orders_count ??
            d?.orders?.active ??
            0
        ),
      0
    );

    const inActiveOrders = list.reduce((sum, d) => {
      const total = toInt(
        d?.totalOrders ??
          d?.orders_total ??
          d?.ordersCount ??
          d?.orders_count ??
          d?.orders ??
          0
      );
      const active = toInt(
        d?.activeOrdersCount ??
          d?.activeOrders ??
          d?.ordersActive ??
          d?.orders_active ??
          0
      );
      let inactive = toInt(
        d?.unsyncOrdersCount ??
          d?.unsyncedOrdersCount ??
          d?.unsynced_count ??
          d?.unsynced ??
          d?.inActiveOrders ??
          d?.inactiveOrders ??
          d?.orders_inactive
      );
      if (!inactive && total && active <= total) inactive = Math.max(total - active, 0);
      return sum + inactive;
    }, 0);

    setDashboardMetrics({
      totalDevices: list.length,
      onlineDevices: online,
      offlineDevices: offline,
      activeOrders,
      inActiveOrders,
      totalOrders: activeOrders + inActiveOrders,
    });
  }, []);

  const [merchantList, setMerchantList] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [merchantOptions, setMerchantOptions] = useState(['All Merchants']);
  const [branchOptions, setBranchOptions] = useState(['All Branches']);

  const axiosHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

  const fetchMerchants = useCallback(async () => {
    try {
      const res = await axios.get(MERCHANTS_URL, { headers: axiosHeaders });
      const arr = Array.isArray(res?.data?.data) ? res.data.data : res?.data || [];
      const merchants = arr
        .filter(Boolean)
        .map((m) => ({ id: m?.id, name: m?.name }))
        .filter((m) => m.id != null && typeof m.name === 'string' && m.name.trim().length > 0);

      setMerchantList(merchants);
      setMerchantOptions(['All Merchants', ...merchants.map((m) => m.name)]);
    } catch (e) {
      console.error('Merchants Error:', e?.response?.data || e?.message);
      setMerchantList([]);
      setMerchantOptions(['All Merchants']);
    }
  }, [authToken]);

  const fetchBranches = useCallback(
    async (merchantId = null) => {
      if (!authToken) {
        console.warn('Cannot fetch branches: Authentication token is missing.');
        setBranchOptions(['All Branches']);
        setBranchList([]);
        return;
      }
      const currentHeaders = { Authorization: `Bearer ${authToken}` };

      try {
        let url = BRANCHES_URL_BASE;
        if (merchantId != null) {
          url = `${BRANCHES_URL_BASE}?merchantID=${merchantId}`;
        }

        console.log('Fetching Branches URL:', url);
        const res = await axios.get(url, { headers: currentHeaders });
        const arr = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        const branches = arr
          .filter(Boolean)
          .map((b) => ({
            id: b?.id,
            name: b?.name ?? b?.branch_name ?? b?.branch?.name ?? b?.title,
          }))
          .filter(
            (b) => b.id != null && typeof b.name === 'string' && b.name.trim().length > 0
          );

        setBranchList(branches);
        setBranchOptions(['All Branches', ...branches.map((b) => b.name)]);
      } catch (e) {
        console.error('Branches Error (API Call Failed):', e?.response?.data || e?.message);
        setBranchOptions(['All Branches']);
        setBranchList([]);
        if (e?.response?.status === 401 || String(e?.message).includes('access')) {
          console.warn('Branch API is rejecting the token/access. This is a server issue.');
        }
      }
    },
    [authToken]
  );

  const fetchPosDevices = async (showLoading = true) => {
    showLoading && setIsLoading(true);
    try {
      const params = {};
      if (selectedMerchant && selectedMerchant !== 'All Merchants') {
        const found = merchantList.find(
          (m) => String(m.name) === String(selectedMerchant)
        );
        if (found?.id != null) {
          params.merchantID = found.id;
        }
      }
      if (selectedBranch && selectedBranch !== 'All Branches') {
        const foundB = branchList.find(
          (b) => String(b.name) === String(selectedBranch)
        );
        if (foundB?.id != null) {
          params.branchID = foundB.id;
        }
      }

      const res = await axios.get(POS_DEVICES_URL, {
        headers: axiosHeaders,
        params,
      });

      const arr = Array.isArray(res?.data)
        ? res.data
        : res?.data?.devices ?? res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
      const devices = Array.isArray(arr) ? arr : [];
      dispatch(setPosDevices(devices));
      calculateMetrics(devices);
    } catch (e) {
      console.error('Home API Error:', e?.response?.data || e?.message);
      Alert.alert('Network Error', 'Could not connect to the POS server.');
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
      fetchMerchants();
      fetchBranches(null);
    } else {
      Alert.alert('Authentication Error', 'Please log in again to fetch data.');
    }
  }, [authToken]);

  useEffect(() => {
    calculateMetrics(posDevices);
  }, [posDevices, calculateMetrics]);

  useEffect(() => {
    if (!selectedMerchant || selectedMerchant === 'All Merchants') {
      fetchBranches(null);
      setSelectedBranch(null);
    } else {
      const found = merchantList.find((m) => String(m.name) === String(selectedMerchant));
      const mId = found?.id;
      if (mId != null) {
        fetchBranches(mId);
        setSelectedBranch(null);
      }
    }
  }, [selectedMerchant, merchantList, fetchBranches]);

  useEffect(() => {
    if (authToken) {
      fetchPosDevices();
    }
  }, [selectedMerchant, selectedBranch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const mId =
      selectedMerchant && selectedMerchant !== 'All Merchants'
        ? merchantList.find((m) => m.name === selectedMerchant)?.id ?? null
        : null;
    Promise.all([fetchPosDevices(false), fetchMerchants(), fetchBranches(mId)])
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [fetchMerchants, fetchBranches, fetchPosDevices, selectedMerchant, merchantList]);

  const handleNavigation = (type) =>
    navigation.navigate('DeviceList', { deviceType: type });

  // ---- Order stats placeholder (API aane ke baad change kar sakte ho) ----
  const orderStats = {
    totalOrders: dashboardMetrics.totalOrders ?? 0,
    totalAmount: 0,       // abhi 0, baad me real amount
    pendingOrders: 0,
    acceptedOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Home Screen</Text>
        <Text style={styles.subHeader}>Welcome to your dashboard, {userName}.</Text>
        <TouchableOpacity
          onPress={() => fetchPosDevices(true)}
          style={styles.refreshBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={22} color="#007BFF" />
          <Text style={{ fontSize: 12, color: '#007BFF' }}>Refresh</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Branch</Text>
            <TouchableOpacity
              onPress={() => {
                if (!selectedMerchant) {
                  Alert.alert('Select Merchant', 'Please select a merchant first.');
                  return;
                }
                setPickerOpen({ open: true, type: 'branch' });
              }}
              style={[styles.inputPicker, !selectedMerchant && styles.inputPickerDisabled]}
              activeOpacity={!selectedMerchant ? 1 : 0.8}
              disabled={!selectedMerchant}
            >
              <Text style={{ color: selectedBranch ? '#111' : '#999' }}>
                {selectedBranch || 'All Branches'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={!selectedMerchant ? '#bbb' : '#666'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Merchant</Text>
            <TouchableOpacity
              onPress={() => setPickerOpen({ open: true, type: 'merchant' })}
              style={styles.inputPicker}
              activeOpacity={0.8}
            >
              <Text style={{ color: selectedMerchant ? '#111' : '#999' }}>
                {selectedMerchant || 'All Merchants'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={pickerOpen.open}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen({ open: false, type: null })}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
                {pickerOpen.type === 'branch' ? 'Select Branch' : 'Select Merchant'}
              </Text>

              {pickerOpen.type === 'branch' && !selectedMerchant ? (
                <Text style={{ color: '#f44336', marginBottom: 8 }}>
                  Please select a merchant first.
                </Text>
              ) : null}

              <FlatList
                data={pickerOpen.type === 'branch' ? branchOptions : merchantOptions}
                keyExtractor={(item, idx) => String(item) + idx}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (pickerOpen.type === 'branch') {
                        setSelectedBranch(item === 'All Branches' ? null : item);
                      } else {
                        setSelectedMerchant(item === 'All Merchants' ? null : item);
                      }
                      setPickerOpen({ open: false, type: null });
                    }}
                    style={styles.optionRow}
                  >
                    <Text style={{ color: '#111' }}>{item}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: '#eee' }} />
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    onPress={() => setPickerOpen({ open: false, type: null })}
                    style={styles.closeBtn}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
                  </TouchableOpacity>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
      <Text style={styles.sectionTitle}>Devices</Text>

      <View style={styles.grid}>
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

      <Text style={styles.sectionTitle}>Orders</Text>

      <View style={styles.grid}>
        <DashboardCard
          title="Total Orders"
          count={orderStats.totalOrders}
          icon="cart-outline"
          color="#ff6f61"
        />
        <DashboardCard
          title="Total Amount (SAR)"
          count={orderStats.totalAmount}
          icon="cash-outline"
          color="#009688"
        />
        <DashboardCard
          title="Pending Orders"
          count={orderStats.pendingOrders}
          icon="time-outline"
          color="#ff9800"
        />
        <DashboardCard
          title="Accepted Orders"
          count={orderStats.acceptedOrders}
          icon="checkmark-circle-outline"
          color="#2196F3"
        />
        <DashboardCard
          title="Ready Orders"
          count={orderStats.readyOrders}
          icon="cube-outline"
          color="#00bcd4"
        />
        <DashboardCard
          title="Delivered Orders"
          count={orderStats.deliveredOrders}
          icon="checkmark-done-outline"
          color="#4caf50"
        />
      </View>

      <Text style={{ marginTop: 20, color: '#666' }}>
        Pull down or press Refresh to reload data.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scrollView: { flex: 1, backgroundColor: '#f0f4f7' },
  scrollContent: { padding: 10, alignItems: 'center', minHeight: '100%' },
  header: { width: '100%', padding: 15, marginBottom: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subHeader: { fontSize: 16, color: '#6c757d', marginTop: 5 },
  refreshBtn: { position: 'absolute', right: 15, top: 15, alignItems: 'center' },

  filterRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  filterCol: { flex: 1 },
  filterLabel: { marginBottom: 6, color: '#6c757d' },
  inputPicker: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputPickerDisabled: { opacity: 0.6, borderColor: '#e6e6e6', backgroundColor: '#fafafa' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 12, padding: 12, maxHeight: '70%' },
  optionRow: { paddingVertical: 12, paddingHorizontal: 6 },
  closeBtn: { marginTop: 10, backgroundColor: '#007BFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },

  sectionTitle: {
    width: '100%',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 5,
  },

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