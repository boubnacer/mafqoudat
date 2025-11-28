import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, AppState } from 'react-native';
import { LanguageProvider } from './src/context/LanguageContext';
import { oauthState } from './src/utils/oauthState';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import PostsListScreen from './src/screens/PostsListScreen';
import CountrySelectionScreen from './src/screens/CountrySelectionScreen';
import OAuthCallbackScreen from './src/screens/OAuthCallbackScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef();
  const isReadyRef = useRef(false);

  useEffect(() => {
    // Handle deep linking for OAuth callback
    const handleDeepLink = (event) => {
      const { url } = event;
      console.log('🔗 Deep link received:', url);
      
      // Check if it's an OAuth callback (deep link or web URL)
      const isOAuthCallback = url && (
        url.startsWith('mafqoudat://auth/callback') || 
        url.includes('/auth/callback') ||
        url.includes('auth/callback') ||
        (url.includes('auth/callback') && (url.includes('token=') || url.includes('pendingToken=') || url.includes('error=')))
      );
      
      if (isOAuthCallback) {
        console.log('✅ Processing OAuth callback deep link...');
        
        try {
          // Handle both deep link and web URL formats
          let urlObj;
          let searchParams;
          
          try {
            // Try parsing as-is first
            urlObj = new URL(url);
            searchParams = new URLSearchParams(urlObj.search);
          } catch (e) {
            // If URL parsing fails, try to construct it
            console.log('URL parsing failed, trying alternative format...');
            if (url.startsWith('mafqoudat://')) {
              // Replace deep link scheme with https for URL parsing
              const httpsUrl = url.replace('mafqoudat://', 'https://');
              urlObj = new URL(httpsUrl);
              searchParams = new URLSearchParams(urlObj.search);
            } else {
              // Try to extract query string manually
              const queryMatch = url.match(/\?(.+)$/);
              if (queryMatch) {
                searchParams = new URLSearchParams(queryMatch[1]);
              } else {
                throw new Error('Could not parse URL');
              }
            }
          }
          
          const token = searchParams.get('token');
          const pendingToken = searchParams.get('pendingToken');
          const error = searchParams.get('error');

          console.log('📋 Deep link params:', { 
            token: token ? `${token.substring(0, 20)}...` : null, 
            pendingToken: pendingToken ? `${pendingToken.substring(0, 20)}...` : null, 
            error 
          });

          // Parse the callback URL
          let parsedResult = null;
          if (token) {
            parsedResult = { type: 'success', accessToken: token };
          } else if (pendingToken) {
            parsedResult = { type: 'pending', pendingToken: pendingToken };
          } else if (error) {
            parsedResult = { type: 'error', error: error };
          }

          // Resolve OAuth state if waiting (this is critical!)
          if (parsedResult) {
            console.log('✅ Resolving OAuth state with result:', parsedResult.type);
            oauthState.resolveCallback(parsedResult);
          } else {
            console.warn('⚠️ No valid OAuth result parsed from URL');
          }

          // Also navigate to appropriate screen if navigation is ready
          if (isReadyRef.current && navigationRef.current) {
            if (token) {
              console.log('🧭 Navigating to OAuthCallback with token');
              navigationRef.current.navigate('OAuthCallback', { token });
            } else if (pendingToken) {
              console.log('🧭 Navigating to CountrySelection with pendingToken');
              navigationRef.current.navigate('CountrySelection', { pendingToken });
            } else if (error) {
              console.log('🧭 Navigating to OAuthCallback with error');
              navigationRef.current.navigate('OAuthCallback', { error });
            }
          } else {
            console.log('⏳ Navigation not ready yet, OAuth state resolved');
          }
        } catch (err) {
          console.error('❌ Error handling deep link:', err);
        }
      } else {
        console.log('ℹ️ Deep link received but not an OAuth callback');
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL on app start:', url);
        handleDeepLink({ url });
      } else {
        console.log('ℹ️ No initial URL found');
      }
    }).catch((err) => {
      console.error('Error getting initial URL:', err);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Linking event received:', event);
      handleDeepLink(event);
    });
    console.log('👂 Deep link listener registered');
    
    // Also listen for app state changes (when app comes to foreground)
    // This is critical - when user returns from browser, check for deep link
    let appState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App state changed:', appState, '->', nextAppState);
      
      // When app comes to foreground (from background)
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App became active, checking for deep link...');
        
        // Check for deep link immediately
        Linking.getInitialURL().then((url) => {
          console.log('🔍 getInitialURL result:', url);
          if (url && (url.includes('auth/callback') || url.startsWith('mafqoudat://'))) {
            console.log('🔗 Found deep link when app became active:', url);
            handleDeepLink({ url });
          } else {
            // Also try to get the current URL (might be different)
            console.log('ℹ️ No initial URL found, app might have been opened normally');
          }
        }).catch((err) => {
          console.error('Error checking URL on app state change:', err);
        });
        
        // Also check again after a short delay (deep link might arrive slightly after app becomes active)
        setTimeout(() => {
          Linking.getInitialURL().then((url) => {
            if (url && (url.includes('auth/callback') || url.startsWith('mafqoudat://'))) {
              console.log('🔗 Found deep link on delayed check:', url);
              handleDeepLink({ url });
            }
          }).catch((err) => {
            console.error('Error on delayed URL check:', err);
          });
        }, 500);
      }
      
      appState = nextAppState;
    });

    return () => {
      console.log('🔇 Removing deep link listener');
      subscription?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            isReadyRef.current = true;
          }}
        >
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PostsList" component={PostsListScreen} />
            <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
            <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}

