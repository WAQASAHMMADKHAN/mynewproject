import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';


const BASE_URL = 'http://51.112.221.81:8000'; 


const initialState = {
  posDevices: [],          
  merchants: [],          
  isLoadingDevices: false,
  isLoadingMerchants: false,
  errorDevices: null,
  errorMerchants: null,
};
export const fetchPosDevicesAsync = createAsyncThunk(
  'data/fetchPosDevices',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.auth.userData.authToken;

    if (!token) {
      return rejectWithValue('No authentication token found for devices.');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/pos-devices/fetchPosDevices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseText = await response.text(); 
      
      if (!response.ok) {
        let errorMsg;
        if (response.status === 401) {
            errorMsg = 'Unauthorized: Invalid or expired token. Please log in again.';
        } else {
            try {
                
                const errorJson = JSON.parse(responseText);
                errorMsg = errorJson.message || `Devices API Error (${response.status})`;
            } catch {
              
                errorMsg = `Fetch Devices Failed: Non-JSON response received with status ${response.status}. Token is likely invalid.`;
            }
        }
        return rejectWithValue(errorMsg);
      }

     
      const data = JSON.parse(responseText);
      return data.devices || data || []; 

    } catch (error) {
      return rejectWithValue(`Network/Parsing failed: ${error.message}`);
    }
  }
);
export const fetchMerchantListAsync = createAsyncThunk( 
  'data/fetchMerchantList',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.auth.userData.authToken;
    
    if (!token) {
      return rejectWithValue('No authentication token found for merchant list.');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/merchant/getMerchantsList`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
      });

      const responseText = await response.text(); 
      
      if (!response.ok) {
        let errorMsg;
        if (response.status === 401) {
            errorMsg = 'Unauthorized: Invalid or expired token. Please log in again.';
        } else {
            try {
             
                const errorJson = JSON.parse(responseText);
                errorMsg = errorJson.message || `Merchant API Error (${response.status})`;
            } catch {
                
                errorMsg = `Fetch Merchants Failed: Non-JSON response received with status ${response.status}. Token is likely invalid.`;
            }
        }
        return rejectWithValue(errorMsg);
      }
      
      const data = JSON.parse(responseText);

      if (Array.isArray(data)) {
          return data; 
      } else {
          return rejectWithValue('Invalid data structure: Expected a direct array of merchants.');
      }

    } catch (error) {
      return rejectWithValue(`Network/Parsing failed: ${error.message}`);
    }
  }
);
export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setPosDevices: (state, action) => {
      state.posDevices = action.payload;
    },
   
    clearPosDevices: (state) => {
      state.posDevices = [];
      state.merchants = []; 
      state.errorDevices = null;
      state.errorMerchants = null;
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchPosDevicesAsync.pending, (state) => {
        state.isLoadingDevices = true;
        state.errorDevices = null;
      })
      .addCase(fetchPosDevicesAsync.fulfilled, (state, action) => {
        state.isLoadingDevices = false;
        state.posDevices = action.payload;
      })
      .addCase(fetchPosDevicesAsync.rejected, (state, action) => {
        state.isLoadingDevices = false;
        state.errorDevices = action.payload;
        state.posDevices = []; 
      })
    
      .addCase(fetchMerchantListAsync.pending, (state) => {
        state.isLoadingMerchants = true;
        state.errorMerchants = null;
      })
      .addCase(fetchMerchantListAsync.fulfilled, (state, action) => {
        state.isLoadingMerchants = false;
        state.merchants = action.payload; 
      })
      .addCase(fetchMerchantListAsync.rejected, (state, action) => {
        state.isLoadingMerchants = false;
        state.errorMerchants = action.payload;
        state.merchants = []; 
      });
  }
});

export const { setPosDevices, clearPosDevices } = dataSlice.actions;


export default dataSlice.reducer;