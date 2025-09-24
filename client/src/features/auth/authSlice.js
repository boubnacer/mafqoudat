import { createSlice } from "@reduxjs/toolkit";
import { authStorage } from "../../utils/authStorage";

// Get initial state from localStorage using centralized auth utility
const getInitialState = () => {
  const authState = authStorage.getAuthState();
  
  return {
    token: authState.token,
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    isLoading: false,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.token = accessToken;
      state.isLoggedIn = true;
      state.user = user || null;
      
      // Persist to localStorage using centralized auth utility
      authStorage.setCredentials({ accessToken, user });
    },
    logOut: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      
      // Clear localStorage using centralized auth utility
      authStorage.setLoggedOut();
    },
    setUser: (state, action) => {
      state.user = action.payload;
      
      // Update user data in localStorage using centralized auth utility
      authStorage.updateUserData(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuth: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      
      // Clear all auth-related localStorage using centralized auth utility
      authStorage.clearAuth();
    },
  },
});

export const { setCredentials, logOut, setUser, setLoading, clearAuth } = authSlice.actions;

export const selectCurrentToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;

export default authSlice.reducer;
