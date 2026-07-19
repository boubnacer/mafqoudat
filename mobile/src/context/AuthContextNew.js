import React, { createContext, useContext, useReducer, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import googleAuthNew, { useGoogleIdTokenAuth } from '../utils/googleAuthNew';
import { storage } from '../utils/storage';
import { decodeToken } from '../utils/tokenUtils';

// Legacy AsyncStorage keys from the old (pre-SecureStore) storage scheme
const LEGACY_TOKEN_KEY = 'authToken';
const LEGACY_USER_KEY = 'authUser';

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

// One-time migration from the old AsyncStorage-based token/user keys to SecureStore,
// so users who logged in before the storage consolidation aren't logged out.
const migrateLegacyStorage = async () => {
  try {
    const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (!legacyToken) {
      return;
    }

    await storage.setToken(legacyToken);

    // The old flow stored a fabricated placeholder user; derive the real one from the token instead.
    const user = decodeToken(legacyToken);
    if (user) {
      await storage.setUserData(user);
    }

    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    await AsyncStorage.removeItem(LEGACY_USER_KEY);
    console.log('✅ Migrated legacy auth storage to SecureStore');
  } catch (error) {
    console.error('❌ Error migrating legacy auth storage:', error);
  }
};

// Provider component
export const AuthProviderNew = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [pendingToken, setPendingToken] = useState(null);
  const [request, response, promptAsync] = useGoogleIdTokenAuth();

  // Load stored auth data on app start
  React.useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await migrateLegacyStorage();

      const storedToken = await storage.getToken();
      const storedUser = await storage.getUserData();

      if (storedToken && storedUser) {
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: storedToken });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: storedUser });
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

      if (!request) {
        const message = 'Google sign-in is not ready yet, please try again';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }

      console.log('🚀 Starting native Google sign in...');
      const promptResult = await promptAsync();

      if (promptResult.type === 'cancel' || promptResult.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      if (promptResult.type !== 'success') {
        const message = 'Google sign-in failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }

      const idToken = promptResult.params?.id_token;
      if (!idToken) {
        const message = 'No ID token received from Google';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }

      // Decode the Google ID token client-side just to get the email/name the
      // server's /auth/google/mobile contract cross-checks against the verified token.
      const googlePayload = jwtDecode(idToken);
      const authResult = await googleAuthNew.verifyIdToken(idToken, {
        email: googlePayload.email,
        name: googlePayload.name,
      });

      if (authResult.success && authResult.accessToken) {
        await storage.setToken(authResult.accessToken);
        const user = decodeToken(authResult.accessToken);
        if (user) {
          await storage.setUserData(user);
        }

        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: authResult.accessToken });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

        console.log('✅ Google sign in successful');
        return { success: true, user };
      }

      if (authResult.pending && authResult.pendingToken) {
        console.log('⏳ New user, needs country selection');
        setPendingToken(authResult.pendingToken);
        return { success: false, pending: true, pendingToken: authResult.pendingToken };
      }

      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: authResult.error });
      return { success: false, error: authResult.error };
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const completeGoogleRegistration = async (countryId) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      if (!pendingToken) {
        const message = 'No pending Google registration found';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }

      console.log('🔄 Completing Google registration...');
      const result = await googleAuthNew.completeRegistration(pendingToken, countryId);

      if (result.success && result.accessToken) {
        await storage.setToken(result.accessToken);
        const user = decodeToken(result.accessToken) || { username: result.username };
        await storage.setUserData(user);

        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: result.accessToken });
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        setPendingToken(null);

        console.log('✅ Google registration completed successfully');
        return { success: true, user };
      }

      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
      return { success: false, error: result.error };
    } catch (error) {
      console.error('❌ Complete Google registration error:', error);
      const errorMessage = error.message || 'Failed to complete registration';
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
        try {
          await googleAuthNew.signOut(state.token);
        } catch (error) {
          // Even if server sign out fails, still clear local data below
          console.error('❌ Server sign out failed:', error);
        }
      }

      await storage.clearAll();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      await storage.clearAll();
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
    pendingToken,
    signInWithGoogle,
    signOut,
    clearError,
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
