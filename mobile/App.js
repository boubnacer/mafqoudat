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

  // Simplified deep linking - Expo AuthSession handles most of this automatically
  // Only keeping basic deep link handling for manual token entry fallback
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      
      if (url && url.startsWith('mafqoudat://auth/callback')) {
        try {
          const urlObj = new URL(url.replace('mafqoudat://', 'https://'));
          const searchParams = new URLSearchParams(urlObj.search);
          
          const token = searchParams.get('token');
          const pendingToken = searchParams.get('pendingToken');
          const error = searchParams.get('error');

          if (isReadyRef.current && navigationRef.current) {
            if (token) {
              navigationRef.current.navigate('OAuthCallback', { token });
            } else if (pendingToken) {
              navigationRef.current.navigate('CountrySelection', { pendingToken });
            } else if (error) {
              navigationRef.current.navigate('OAuthCallback', { error });
            }
          }
        } catch (err) {
          console.error('Deep link handling error:', err);
        }
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    }).catch(() => {
      // Silent fail
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
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
