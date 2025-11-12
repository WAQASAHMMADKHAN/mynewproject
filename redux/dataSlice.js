import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { selectToken } from './authSlice'; 

const BASE_URL = 'http://3.29.1.212:8000';

export const fetchPosDevicesAsync = createAsyncThunk(
  'data/fetchPosDevices',
  async (_, { getState }) => {
    const state = getState();
    const token = selectToken(state); 
    const res = await axios.get(`${BASE_URL}/api/pos-devices/fetchPosDevices`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: 15000,
    });
    const payload = Array.isArray(res.data)
      ? res.data
      : (res.data?.devices || res.data?.data || []);

    return Array.isArray(payload) ? payload : [];
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    posDevices: [],
    loading: false,
    error: null,
  },
  reducers: {
    setPosDevices(state, action) {
      state.posDevices = Array.isArray(action.payload) ? action.payload : [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosDevicesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosDevicesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.posDevices = action.payload;
      })
      .addCase(fetchPosDevicesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch devices';
      });
  },
});

export const { setPosDevices } = dataSlice.actions;
export default dataSlice.reducer;
