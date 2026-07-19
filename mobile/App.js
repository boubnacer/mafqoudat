import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ReferenceDataProvider } from './src/context/ReferenceDataContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import CountrySelectionScreen from './src/screens/CountrySelectionScreen';
import PostsListScreen from './src/screens/PostsListScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import NewPostScreen from './src/screens/NewPostScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import MyPostsScreen from './src/screens/MyPostsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const Stack = createNativeStackNavigator();

// Auth navigator component: Welcome (country/language landing) -> Login -> CountrySelection
// (the latter only reached mid-flow for brand-new Google sign-ups pending a country pick).
const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
    </Stack.Navigator>
  );
};

// App navigator component
const AppNavigator = () => {
  return (
    <ReferenceDataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PostsListScreen" component={PostsListScreen} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="NewPostScreen" component={NewPostScreen} />
        <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
        <Stack.Screen name="MyPostsScreen" component={MyPostsScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        {/* Add other authenticated screens here */}
      </Stack.Navigator>
    </ReferenceDataProvider>
  );
};

// Root navigator that handles auth state
const RootNavigator = () => {
  const { isLoading, isSignedIn } = useAuth();

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
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </SafeAreaProvider>
      </AuthProvider>
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
