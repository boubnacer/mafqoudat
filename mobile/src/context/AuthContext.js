import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import googleAuth, { useGoogleIdTokenAuth } from '../utils/googleAuth';
import { storage } from '../utils/storage';
import { decodeToken } from '../utils/tokenUtils';
import { USE_NATIVE_GOOGLE_AUTH } from '../config/api';
import { setAuthFailureHandler } from '../app/api/apiService';

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
const AuthContext = createContext();

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
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [pendingToken, setPendingToken] = useState(null);
  // Which flow minted pendingToken ('native' | 'browser') - the two live in separate
  // in-memory maps server-side, so completion must be routed back to the same one.
  const [pendingAuthMethod, setPendingAuthMethod] = useState('native');
  const [request, response, promptAsync] = useGoogleIdTokenAuth();
  const [sessionExpired, setSessionExpired] = useState(false);

  // Registered with apiService's response interceptor so a 401/403 that means "your
  // token is no longer valid" (not a resource-ownership 403 - see apiService.js for the
  // distinction) can clear the session from outside the React tree. Deliberately removes
  // only the token/user, not storage.clearAll()'s full wipe: leaving the onboarding-picked
  // country in place lets WelcomeScreen's checkStoredCountry auto-skip straight to Login
  // instead of dropping the user back into the full country-picker flow.
  const forceSignOut = useCallback(async () => {
    await storage.removeToken();
    await storage.removeUserData();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(forceSignOut);
    return () => setAuthFailureHandler(null);
  }, [forceSignOut]);

  const clearSessionExpired = () => setSessionExpired(false);

  // Shared by every path that ends up with a valid access token (password login,
  // Google sign-in, Google registration): persists it and flips auth state, which
  // is what drives RootNavigator (App.js) to swap to the signed-in screens.
  const persistSession = async (accessToken, fallbackUser) => {
    await storage.setToken(accessToken);
    const user = decodeToken(accessToken) || fallbackUser || null;
    if (user) {
      await storage.setUserData(user);
    }

    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: accessToken });
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    return user;
  };

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

  // Native path (default): expo-auth-session ID-token request -> POST /auth/google/mobile.
  const signInWithGoogleNative = async () => {
    if (!request) {
      return { success: false, error: 'Google sign-in is not ready yet, please try again' };
    }

    console.log('🚀 Starting native Google sign in...');
    const promptResult = await promptAsync();

    if (promptResult.type === 'cancel' || promptResult.type === 'dismiss') {
      return { success: false, cancelled: true };
    }

    if (promptResult.type !== 'success') {
      return { success: false, error: 'Google sign-in failed' };
    }

    const idToken = promptResult.params?.id_token;
    if (!idToken) {
      return { success: false, error: 'No ID token received from Google' };
    }

    // Decode the Google ID token client-side just to get the email/name the
    // server's /auth/google/mobile contract cross-checks against the verified token.
    const googlePayload = jwtDecode(idToken);
    return googleAuth.verifyIdToken(idToken, {
      email: googlePayload.email,
      name: googlePayload.name,
    });
  };

  const signInWithGoogle = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const method = USE_NATIVE_GOOGLE_AUTH ? 'native' : 'browser';
      const authResult = USE_NATIVE_GOOGLE_AUTH
        ? await signInWithGoogleNative()
        : await googleAuth.signInWithGoogleBrowser();

      if (authResult.cancelled) {
        return { success: false, cancelled: true };
      }

      if (authResult.success && authResult.accessToken) {
        const user = await persistSession(authResult.accessToken);
        console.log('✅ Google sign in successful');
        return { success: true, user };
      }

      if (authResult.pending && authResult.pendingToken) {
        console.log('⏳ New user, needs country selection');
        setPendingToken(authResult.pendingToken);
        setPendingAuthMethod(method);
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
      const result = await googleAuth.completeRegistration(pendingToken, countryId, pendingAuthMethod);

      if (result.success && result.accessToken) {
        const user = await persistSession(result.accessToken, { username: result.username });
        setPendingToken(null);
        setPendingAuthMethod('native');

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

  // Called by LoginScreen after a successful POST /auth (password login) to persist
  // the token through the same single storage/state path Google sign-in uses, so
  // isSignedIn flips and RootNavigator swaps to the signed-in screens automatically.
  const completeLogin = async (accessToken) => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    return persistSession(accessToken);
  };

  const signOut = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      if (state.token) {
        try {
          await googleAuth.signOut(state.token);
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

  // PATCH /users mints a fresh accessToken whenever username or country changes
  // (the JWT embeds both) - screens that trigger that (e.g. EditProfileScreen)
  // must call this so the stored/in-memory session isn't left stale.
  const refreshSession = async (accessToken) => {
    return persistSession(accessToken);
  };

  const value = {
    ...state,
    pendingToken,
    signInWithGoogle,
    signOut,
    clearError,
    completeGoogleRegistration,
    completeLogin,
    refreshSession,
    sessionExpired,
    clearSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
