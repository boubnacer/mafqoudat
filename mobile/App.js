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

  // Simplified deep linking for OAuth callback
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      
      console.log('Deep link received:', url);
      
      if (url && url.includes('mafqoudat://')) {
        try {
          // Parse the deep link URL
          const urlObj = new URL(url.replace('mafqoudat://', 'https://'));
          const searchParams = new URLSearchParams(urlObj.search);
          
          const token = searchParams.get('token');
          const pendingToken = searchParams.get('pendingToken');
          const error = searchParams.get('error');

          console.log('Parsed deep link:', { token, pendingToken, error });

          // Navigate based on the response
          if (isReadyRef.current && navigationRef.current) {
            if (token) {
              console.log('Navigating to OAuthCallback with token');
              navigationRef.current.navigate('OAuthCallback', { token });
            } else if (pendingToken) {
              console.log('Navigating to CountrySelection with pendingToken');
              navigationRef.current.navigate('CountrySelection', { pendingToken });
            } else if (error) {
              console.log('Navigating to OAuthCallback with error');
              navigationRef.current.navigate('OAuthCallback', { error });
            }
          } else {
            console.log('Navigation not ready, storing deep link for later');
            // Store the deep link to handle when navigation is ready
            global.pendingDeepLink = url;
          }
        } catch (err) {
          console.error('Deep link handling error:', err);
        }
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL found:', url);
        handleDeepLink({ url });
      }
    }).catch((err) => {
      console.error('Error getting initial URL:', err);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle any pending deep link when navigation becomes ready
    const checkPendingDeepLink = () => {
      if (global.pendingDeepLink && isReadyRef.current && navigationRef.current) {
        console.log('Processing pending deep link:', global.pendingDeepLink);
        handleDeepLink({ url: global.pendingDeepLink });
        global.pendingDeepLink = null;
      }
    };

    // Check for pending deep links periodically
    const pendingCheckInterval = setInterval(checkPendingDeepLink, 500);

    return () => {
      subscription?.remove();
      clearInterval(pendingCheckInterval);
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
