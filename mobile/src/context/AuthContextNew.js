import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import googleAuthNew from '../utils/googleAuthNew';

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  token: null,
  error: null,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isSignedIn: !!action.payload,
      };
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isSignedIn: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContextNew = createContext();

// Provider component
export const AuthProviderNew = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: storedToken });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        console.log('✅ Loaded stored authentication');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Failed to load authentication' });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const signInWithGoogle = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      console.log('🚀 Starting Google sign in...');

      // Use new Google Auth implementation
      const result = await googleAuthNew.authenticate();

      if (result.success) {
        const { user, token } = result;

        // Store auth data
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('authUser', JSON.stringify(user));

        // Update state
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

        console.log('✅ Google sign in successful');
        return { success: true, user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const signOut = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      if (state.token) {
        // Call server sign out
        await googleAuthNew.signOut(state.token);
      }

      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');

      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if server sign out fails, clear local data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return (
    <AuthContextNew.Provider value={value}>
      {children}
    </AuthContextNew.Provider>
  );
};

// Hook to use auth context
export const useAuthNew = () => {
  const context = useContext(AuthContextNew);
  if (!context) {
    throw new Error('useAuthNew must be used within an AuthProviderNew');
  }
  return context;
};

export default AuthContextNew;
