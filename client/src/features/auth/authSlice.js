import { createSlice } from "@reduxjs/toolkit";

// Get initial state from localStorage
const getInitialState = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('accessToken');
  
  return {
    token: token || null,
    isLoggedIn: isLoggedIn,
    user: null,
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
      
      // Persist to localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('isLoggedIn', 'true');
    },
    logOut: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.setItem('isLoggedIn', 'false');
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuth: (state, action) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.isLoading = false;
      
      // Clear all auth-related localStorage
      localStorage.removeItem('accessToken');
      localStorage.setItem('isLoggedIn', 'false');
    },
  },
});

export const { setCredentials, logOut, setUser, setLoading, clearAuth } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;
