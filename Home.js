import React, { useState, useEffect, useCallback } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,RefreshControl,Alert,ActivityIndicator,Dimensions,Modal,FlatList,} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Calendar } from 'react-native-calendars';
import { setPosDevices } from './redux/dataSlice';

const POS_DEVICES_URL   = 'http://3.29.1.212:8000/api/pos-devices/fetchPosDevices';
const MERCHANTS_URL     = 'http://3.29.1.212:8000/api/merchant/getMerchantsList';
const BRANCHES_URL_BASE = 'http://3.29.1.212:8000/api/branch/all';
const API_BASE_URL      = 'http://3.29.1.212:8000';
const ORDERS_SUMMARY_URL = '/api/dashboard/orders-summary';
console.log("error")
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
  const userData   = useSelector((s) => s.auth.userData);
  const posDevices = useSelector((s) => s.data.posDevices);
const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZmlyc3ROYW1lIjoiQWhtYWQiLCJsYXN0TmFtZSI6IlJhZmlxdWUiLCJwcm9maWxlSW1hZ2UiOiJodHRwOi8vbG9jYWxob3N0OjgwODQvcHVibGljL3VzZXItaW1hZ2UvZGVmYXVsdC1tYW4ucG5nIiwiZW1haWwiOiJzdXBlcmFkbWluQGdtYWlsLmNvbSIsInBob25lTm8iOiIrODgwMTcwMDEwMDAwMDMiLCJ1c2VyVHlwZSI6ImFkbWluIiwibG9jYXRpb24iOiJhbGwiLCJNZXJjaGFudElkIjpudWxsLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE2VDIwOjQ2OjIwLjAwMFoiLCJpYXQiOjE3NjQwNjY1OTEsImV4cCI6MTc2NDY3MTM5MX0.KPINw5J8u2Tp33ESleoP6M2RD0tKJxEuzHJO28DwQdw';
  console.log('Auth Token:',authToken)
  const userName  = userData?.name || 'User';

  const [isLoading, setIsLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch]     = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [pickerOpen, setPickerOpen] = useState({ open: false, type: null });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [datePicker, setDatePicker] = useState({
    open: false,
    type: null,
  });

  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    activeOrders: 0,
    inActiveOrders: 0,
    totalOrders: 0,
  });

  const [orderSummaryMetrics, setOrderSummaryMetrics] = useState({
    totalOrders: 0,
    totalAmount: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  const [merchantList, setMerchantList] = useState([]);
  const [branchList, setBranchList]     = useState([]);
  const [merchantOptions, setMerchantOptions] = useState(['All Merchants']);
  const [branchOptions, setBranchOptions]     = useState(['All Branches']);

  // yahan se token header ban raha hai
  const axiosHeaders = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : undefined;
   console.log('Axios headers:',)
  const toInt = (v) =>
    typeof v === 'number'
      ? v
      : Number.isFinite(parseInt(v, 10))
      ? parseInt(v, 10)
      : 0;

  const toFloat = (v) =>
    typeof v === 'number'
      ? v
      : Number.isFinite(parseFloat(v))
      ? parseFloat(v)
      : 0;

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
    const online  = list.reduce((sum, d) => sum + (isOnlineFrom(d) ? 1 : 0), 0);
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
      if (!inactive && total && active <= total) {
        inactive = Math.max(total - active, 0);
      }
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
const fetchOrderSummary = useCallback(
  async (paramsFromFilters = {}) => {
    if (!authToken) {
      console.log('❌ NO TOKEN FOUND');
      return;
    }

    const apiParams = {};
    let merchantId = paramsFromFilters.merchantID;
    if (!merchantId) {
      merchantId = 1;
    }

    apiParams.merchantId = merchantId;
    if (paramsFromFilters.branchID) {
      apiParams.branchId = paramsFromFilters.branchID;
    }
    if (startDate) apiParams.startDate = startDate;
    if (endDate) apiParams.endDate = endDate;

    const headers = { Authorization: `Bearer ${authToken}` };

    const instance = axios.create({
      baseURL: API_BASE_URL,
      params: apiParams,
      headers,
    });

    console.log('🔵 ORDER SUMMARY API CALL STARTED');
    console.log('➡ URL:', API_BASE_URL + ORDERS_SUMMARY_URL);
    console.log('➡ PARAMS:', apiParams);
    console.log('➡ HEADERS:', headers);

    try {
      const res = await instance.get(ORDERS_SUMMARY_URL);

      console.log('🟢 ORDER SUMMARY SUCCESS');
      console.log('➡ STATUS:', res.status);
      console.log('➡ FULL RESPONSE:', res.data);

      const data = res?.data?.data ?? res?.data;

      setOrderSummaryMetrics({
        totalOrders: toInt(data.totalOrders),
        totalAmount: toFloat(data.totalAmount || data.total_amount),
        pendingOrders: toInt(data.pendingOrders || data.pending_orders),
        acceptedOrders: toInt(data.acceptedOrders || data.accepted_orders),
        readyOrders: toInt(data.readyOrders || data.ready_orders),
        deliveredOrders: toInt(data.deliveredOrders || data.delivered_orders),
        cancelledOrders: toInt(
          data.cancelledOrders ||
            data.cancelled_orders ||
            data.cancelled ||
            data.inActiveOrders
        ),
      });
    } catch (e) {
      console.log('🔴 ORDER SUMMARY ERROR');
      console.log('➡ MESSAGE:', e?.message);
      console.log('➡ STATUS:', e?.response?.status);
      console.log('➡ ERROR BODY:', e?.response?.data);
      console.log('➡ USED PARAMS:', apiParams);
      console.log('➡ USED HEADERS:', headers);

      setOrderSummaryMetrics({
        totalOrders: dashboardMetrics.totalOrders,
        totalAmount: 0,
        pendingOrders: dashboardMetrics.activeOrders,
        acceptedOrders: 0,
        readyOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: dashboardMetrics.inActiveOrders,
      });
    }
  },
  [
    authToken,
    startDate,
    endDate,
    dashboardMetrics.totalOrders,
    dashboardMetrics.activeOrders,
    dashboardMetrics.inActiveOrders,
  ]
);
  const fetchMerchants = useCallback(async () => {
    try {
      const res = await axios.get(MERCHANTS_URL, { headers: axiosHeaders });
      const arr = Array.isArray(res?.data?.data)
        ? res.data.data
        : res?.data || [];
      const merchants = arr
        .filter(Boolean)
        .map((m) => ({ id: m?.id, name: m?.name }))
        .filter(
          (m) =>
            m.id != null &&
            typeof m.name === 'string' &&
            m.name.trim().length > 0
        );

      setMerchantList(merchants);
      setMerchantOptions(['All Merchants', ...merchants.map((m) => m.name)]);
    } catch (e) {
      console.error('Merchants Error:', e?.response?.data || e?.message);
      setMerchantList([]);
      setMerchantOptions(['All Merchants']);
    }
  }, [axiosHeaders]);

  const fetchBranches = useCallback(
    async (merchantId = null) => {
      if (!authToken) {
        console.warn('Cannot fetch branches: no token');
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
            name:
              b?.name ?? b?.branch_name ?? b?.branch?.name ?? b?.title,
          }))
          .filter(
            (b) =>
              b.id != null &&
              typeof b.name === 'string' &&
              b.name.trim().length > 0
          );

        setBranchList(branches);
        setBranchOptions(['All Branches', ...branches.map((b) => b.name)]);
      } catch (e) {
        console.error('Branches Error:', e?.response?.data || e?.message);
        setBranchOptions(['All Branches']);
        setBranchList([]);
      }
    },
    [authToken]
  );

  const getFilterParams = useCallback(
    () => {
      const params = {};
      let merchantId = null;

      if (selectedMerchant && selectedMerchant !== 'All Merchants') {
        const found = merchantList.find(
          (m) => String(m.name) === String(selectedMerchant)
        );
        if (found?.id != null) {
          params.merchantID = found.id;
          merchantId = found.id;
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
      return { params, merchantId };
    },
    [selectedMerchant, selectedBranch, merchantList, branchList]
  );
const fetchPosDevices = async (showLoading = true) => {
  showLoading && setIsLoading(true);

  
  const { params } = getFilterParams();

  
  const apiParams = {};

  if (params.merchantID) {
    apiParams.merchantId = params.merchantID;    
  }

  if (params.branchID) {
    apiParams.branchId = params.branchID;       
  }

  console.log('fetchPosDevices filter params:', params);
  console.log('fetchPosDevices API params:', apiParams);

  try {
    const res = await axios.get(POS_DEVICES_URL, {
      headers: axiosHeaders,
      params: apiParams, 
    });

    const arr = Array.isArray(res?.data)
      ? res.data
      : res?.data?.devices ??
        res?.data?.data ??
        res?.data?.items ??
        res?.data ??
        [];

    const devices = Array.isArray(arr) ? arr : [];
    console.log('Devices length:', devices.length);

    dispatch(setPosDevices(devices));
    calculateMetrics(devices);
  } catch (e) {
    console.error('Home API Error:', e?.response?.data || e?.message);
    Alert.alert('Network Error', 'Could not connect to the POS server.');
    dispatch(setPosDevices([]));
    calculateMetrics([]);
  } finally {
    showLoading && setIsLoading(false);
    setRefreshing(false);
  }
};
  useEffect(() => {
    if (authToken) {
      const { params, merchantId } = getFilterParams();
      setIsLoading(true);
      Promise.all([
        fetchPosDevices(false),
        fetchMerchants(),
        fetchBranches(null),
        fetchOrderSummary(params),
      ])
        .catch(() => {})
        .finally(() => setIsLoading(false));
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
      const found = merchantList.find(
        (m) => String(m.name) === String(selectedMerchant)
      );
      const mId = found?.id;
      if (mId != null) {
        fetchBranches(mId);
        setSelectedBranch(null);
      }
    }
  }, [selectedMerchant, merchantList, fetchBranches]);

  useEffect(() => {
    if (authToken) {
      const { params } = getFilterParams();
      fetchPosDevices();
      fetchOrderSummary(params);
    }
  }, [selectedMerchant, selectedBranch, startDate, endDate]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const { params, merchantId } = getFilterParams();
    Promise.all([
      fetchPosDevices(false),
      fetchMerchants(),
      fetchBranches(merchantId),
      fetchOrderSummary(params),
    ])
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [
    fetchMerchants,
    fetchBranches,
    fetchPosDevices,
    getFilterParams,
    fetchOrderSummary,
  ]);

  const handleNavigation = (type) =>
    navigation.navigate('DeviceList', { deviceType: type });

  const orderStats = {
    totalOrders:
      orderSummaryMetrics.totalOrders || dashboardMetrics.totalOrders,
    totalAmount: orderSummaryMetrics.totalAmount ?? 0,
    pendingOrders: orderSummaryMetrics.pendingOrders ?? 0,
    acceptedOrders: orderSummaryMetrics.acceptedOrders ?? 0,
    readyOrders: orderSummaryMetrics.readyOrders ?? 0,
    deliveredOrders: orderSummaryMetrics.deliveredOrders ?? 0,
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date;
  };

  const markedDates = {};
  if (startDate) {
    markedDates[startDate] = { selected: true, selectedColor: '#007BFF' };
  }
  if (endDate) {
    markedDates[endDate] = {
      ...(markedDates[endDate] || {}),
      selected: true,
      selectedColor: '#FF9800',
    };
  }

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
      {/* Header + filters */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Home Screen</Text>
        <Text style={styles.subHeader}>
          Welcome to your dashboard, {userName}.
        </Text>
        <TouchableOpacity
          onPress={() => onRefresh()}
          style={styles.refreshBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={22} color="#007BFF" />
          <Text style={{ fontSize: 12, color: '#007BFF' }}>Refresh</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Merchant</Text>
            <TouchableOpacity
              onPress={() =>
                setPickerOpen({ open: true, type: 'merchant' })
              }
              style={styles.inputPicker}
              activeOpacity={0.8}
            >
              <Text style={{ color: selectedMerchant ? '#111' : '#999' }}>
                {selectedMerchant || 'All Merchants'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Branch</Text>
            <TouchableOpacity
              onPress={() => {
                if (!selectedMerchant && branchOptions.length <= 1) {
                  Alert.alert(
                    'Select Merchant',
                    'Please select a merchant first.'
                  );
                  return;
                }
                setPickerOpen({ open: true, type: 'branch' });
              }}
              style={[
                styles.inputPicker,
                !selectedMerchant && branchOptions.length <= 1
                  ? styles.inputPickerDisabled
                  : null,
              ]}
              activeOpacity={
                !selectedMerchant && branchOptions.length <= 1 ? 1 : 0.8
              }
              disabled={!selectedMerchant && branchOptions.length <= 1}
            >
              <Text style={{ color: selectedBranch ? '#111' : '#999' }}>
                {selectedBranch || 'All Branches'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={
                  !selectedMerchant && branchOptions.length <= 1
                    ? '#bbb'
                    : '#666'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={pickerOpen.open}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setPickerOpen({ open: false, type: null })
          }
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                {pickerOpen.type === 'branch'
                  ? 'Select Branch'
                  : 'Select Merchant'}
              </Text>

              {pickerOpen.type === 'branch' && !selectedMerchant && (
                <Text style={{ color: '#f44336', marginBottom: 8 }}>
                  Please select a merchant first.
                </Text>
              )}

              <FlatList
                data={
                  pickerOpen.type === 'branch'
                    ? branchOptions
                    : merchantOptions
                }
                keyExtractor={(item, idx) => String(item) + idx}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (pickerOpen.type === 'branch') {
                        setSelectedBranch(
                          item === 'All Branches' ? null : item
                        );
                      } else {
                        setSelectedMerchant(
                          item === 'All Merchants' ? null : item
                        );
                        setSelectedBranch(null);
                      }
                      setPickerOpen({ open: false, type: null });
                    }}
                    style={styles.optionRow}
                  >
                    <Text style={{ color: '#111' }}>{item}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View
                    style={{ height: 1, backgroundColor: '#eee' }}
                  />
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    onPress={() =>
                      setPickerOpen({ open: false, type: null })
                    }
                    style={[styles.closeBtn, { marginTop: 10 }]}
                  >
                    <Text
                      style={{ color: '#fff', fontWeight: '700' }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                }
              />
            </View>
          </View>
        </Modal>
      </View>

      {/* DEVICES SECTION */}
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
          title="Active Orders (Device)"
          count={dashboardMetrics.activeOrders}
          icon="receipt-outline"
          color="#ff9800"
        />
        <DashboardCard
          title="Inactive Orders (Device)"
          count={dashboardMetrics.inActiveOrders}
          icon="remove-circle-outline"
          color="#9e9e9e"
        />
        <DashboardCard
          title="Total Orders (Device)"
          count={dashboardMetrics.totalOrders}
          icon="layers-outline"
          color="#673AB7"
        />
      </View>
      <View style={[styles.filterRow, { marginTop: 4 }]}>
        <View style={styles.filterCol}>
          <Text style={styles.filterLabel}>Start Date</Text>
          <TouchableOpacity
            onPress={() =>
              setDatePicker({ open: true, type: 'start' })
            }
            style={styles.inputPicker}
            activeOpacity={0.8}
          >
            <Text style={{ color: startDate ? '#111' : '#999' }}>
              {startDate ? formatDate(startDate) : 'Start Date'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.filterCol}>
          <Text style={styles.filterLabel}>End Date</Text>
          <TouchableOpacity
            onPress={() =>
              setDatePicker({ open: true, type: 'end' })
            }
            style={styles.inputPicker}
            activeOpacity={0.8}
          >
            <Text style={{ color: endDate ? '#111' : '#999' }}>
              {endDate ? formatDate(endDate) : 'End Date'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={datePicker.open}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setDatePicker({ open: false, type: null })
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: 16 }]}>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {datePicker.type === 'start'
                ? 'Select Start Date'
                : 'Select End Date'}
            </Text>

            <Calendar
              onDayPress={(day) => {
                const iso = day.dateString;
                if (datePicker.type === 'start') setStartDate(iso);
                else setEndDate(iso);
                setDatePicker({ open: false, type: null });
              }}
              markedDates={markedDates}
            />

            <TouchableOpacity
              onPress={() =>
                setDatePicker({ open: false, type: null })
              }
              style={[styles.closeBtn, { marginTop: 10 }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Orders (API Data)</Text>

      <View style={styles.grid}>
        <DashboardCard
          title="Total Orders"
          count={orderStats.totalOrders}
          icon="cart-outline"
          color="#ff6f61"
        />
        <DashboardCard
          title="Total Amount (SAR)"
          count={orderStats.totalAmount.toFixed(2)}
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
        <DashboardCard
          title="Cancelled Orders"
          count={orderSummaryMetrics.cancelledOrders}
          icon="close-circle-outline"
          color="#795548"
        />
      </View>

      <Text style={{ marginTop: 20, color: '#666' }}>
        Pull down or press Refresh to reload data.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
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
  inputPickerDisabled: {
    opacity: 0.6,
    borderColor: '#e6e6e6',
    backgroundColor: '#fafafa',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    maxHeight: '80%',
  },
  optionRow: { paddingVertical: 12, paddingHorizontal: 6 },
  closeBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

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