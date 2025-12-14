import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { SimpleAuthProvider, useSimpleAuth } from './src/context/SimpleAuthContext';
import SimpleLoginScreen from './src/screens/SimpleLoginScreen';

// Placeholder screens
const HomeScreen = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Welcome Home!</Text>
    <Text style={styles.subtitle}>You are successfully logged in</Text>
  </View>
);

const RegisterScreen = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Register</Text>
    <Text style={styles.subtitle}>Registration screen coming soon</Text>
  </View>
);

const ForgotPasswordScreen = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Forgot Password</Text>
    <Text style={styles.subtitle}>Password reset coming soon</Text>
  </View>
);

const Stack = createNativeStackNavigator();

// Auth Navigator - shown when user is not authenticated
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="Login" 
      options={{ title: 'Sign In', headerShown: false }}
    >
      {(props) => <SimpleLoginScreen {...props} />}
    </Stack.Screen>
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Create Account' }}
    />
    <Stack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordScreen}
      options={{ title: 'Reset Password' }}
    />
  </Stack.Navigator>
);

// App Navigator - shown when user is authenticated
const AppNavigator = () => {
  const { user, logout } = useSimpleAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <Text 
            style={styles.logoutButton} 
            onPress={logout}
          >
            Logout
          </Text>
        ),
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: `Welcome, ${user?.name || 'User'}!` }}
      />
    </Stack.Navigator>
  );
};

// Loading screen
const LoadingScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Main App Content
const AppContent = () => {
  const { loading, isAuthenticated } = useSimpleAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// Main App Component
const AppSimple = () => {
  return (
    <SimpleAuthProvider>
      <AppContent />
    </SimpleAuthProvider>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
    padding: 5,
  },
});

export default AppSimple;
