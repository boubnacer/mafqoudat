import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProviderNew, useAuthNew } from './src/context/AuthContextNew';
import LoginScreenNew from './src/screens/LoginScreenNew';
import CountrySelectionScreen from './src/screens/CountrySelectionScreen';
import PostsListScreen from './src/screens/PostsListScreen';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const Stack = createNativeStackNavigator();

// Auth navigator component
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreenNew} />
      <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
    </Stack.Navigator>
  );
};

// App navigator component
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostsListScreen" component={PostsListScreen} />
      {/* Add other authenticated screens here */}
    </Stack.Navigator>
  );
};

// Root navigator that handles auth state
const RootNavigator = () => {
  const { isLoading, isSignedIn } = useAuthNew();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer fallback={<Text>Loading...</Text>}>
      {isSignedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// Main App component
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Perform any app initialization here
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Mafqoudat Mobile App...');
        
        // Add any initialization logic here
        // For example: checking app updates, loading initial data, etc.
        
        setIsReady(true);
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setIsReady(true); // Still set to true to show the app
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Initializing App...</Text>
      </View>
    );
  }

  return (
    <LanguageProvider>
      <AuthProviderNew>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </SafeAreaProvider>
      </AuthProviderNew>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
