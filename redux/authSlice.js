import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  userData: {
    email: null,
    name: 'User Name', 
    profileImageUri: null, 
    storedPassword: null, 
    userId: null, 
    authToken: null, 
  }, 
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.userData.email = action.payload.email;
      state.userData.storedPassword = action.payload.password; 
      state.userData.userId = action.payload.userId || null;
      state.userData.authToken = action.payload.authToken || null; 
      state.userData.name = action.payload.name || state.userData.name; 
    },
    updateProfile: (state, action) => { 
      if (action.payload.name) { 
        state.userData.name = action.payload.name; 
      }
      if (action.payload.profileImageUri) { 
        state.userData.profileImageUri = action.payload.profileImageUri; 
      }
      if (action.payload.newPassword) { 
        state.userData.storedPassword = action.payload.newPassword; 
      }
    },
    logout: (state) => { 
      state.isLoggedIn = false;
      state.userData = initialState.userData; 
    },
  },
});

export const { loginSuccess, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;