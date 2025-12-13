import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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

      // Use new Google Auth implementation (same as web)
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
      } else if (result.pending) {
        // Authentication is in progress, waiting for deep link callback
        console.log('⏳ Authentication in progress, waiting for callback...');
        return { success: false, pending: true, error: result.error };
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

  const handleDeepLinkCallback = useCallback(async (url) => {
    try {
      console.log('🔗 Handling deep link callback:', url);
      
      // Parse URL to extract token or pendingToken
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      const pendingToken = urlObj.searchParams.get('pendingToken');
      const error = urlObj.searchParams.get('error');

      if (error) {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: `Authentication error: ${error}` });
        return { success: false, error };
      }

      if (token) {
        // Existing user - direct login
        console.log('✅ Received access token for existing user');
        
        // Get user info from token (you might need to decode JWT or call an endpoint)
        // For now, we'll store token and assume user info comes with it
        await AsyncStorage.setItem('authToken', token);
        
        // You might want to fetch user info here
        // For now, we'll create a minimal user object
        const user = { email: 'user@example.com' }; // This should be replaced with actual user data
        
        await AsyncStorage.setItem('authUser', JSON.stringify(user));
        
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        
        return { success: true, user, isNewUser: false };
      } else if (pendingToken) {
        // New user - needs to complete registration
        console.log('⏳ Received pending token for new user');
        return { success: true, pendingToken, isNewUser: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'No authentication data received' });
        return { success: false, error: 'No authentication data received' };
      }
    } catch (error) {
      console.error('❌ Deep link callback error:', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const completeGoogleRegistration = async (pendingToken, countryId) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      console.log('🔄 Completing Google registration...');

      const result = await googleAuthNew.completeRegistration(pendingToken, countryId);

      if (result.success) {
        const { accessToken, username } = result;

        // Store auth data
        await AsyncStorage.setItem('authToken', accessToken);
        
        // Create user object
        const user = { username };
        await AsyncStorage.setItem('authUser', JSON.stringify(user));

        // Update state
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: accessToken });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

        console.log('✅ Google registration completed successfully');
        return { success: true, user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Complete Google registration error:', error);
      const errorMessage = error.message || 'Failed to complete registration';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
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
    handleDeepLinkCallback,
    completeGoogleRegistration,
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
