import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { validateEnv } from './src/config/validateEnv';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MaintenanceProvider, useMaintenance } from './src/context/MaintenanceContext';
import { ReferenceDataProvider } from './src/context/ReferenceDataContext';
import { lightColors, darkColors } from './src/theme/tokens';
import { getNavigationTheme } from './src/theme/navigationTheme';
import { useTranslation } from './src/utils/translations';
import MaintenanceOverlay from './src/components/MaintenanceOverlay';
import OfflineBanner from './src/components/OfflineBanner';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
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

// Runs once, at module evaluation, before anything renders - see validateEnv.js.
validateEnv();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  NewPost: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  MyPosts: { focused: 'list', unfocused: 'list-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

// Auth navigator component: Welcome (country/language landing) -> Login -> CountrySelection
// (the latter only reached mid-flow for brand-new Google sign-ups pending a country pick).
const AuthNavigator = () => {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
    </Stack.Navigator>
  );
};

// Bottom tab navigator: the four primary authenticated destinations. Detail/edit/settings
// screens are pushed on top of this from the root stack (AppNavigator below) rather than
// living inside the tabs, so the tab bar - and each tab's own focus/scroll state - persists
// underneath them.
const MainTabs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icon.focused : icon.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={PostsListScreen} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="NewPost" component={NewPostScreen} options={{ tabBarLabel: t('newPost') }} />
      <Tab.Screen name="MyPosts" component={MyPostsScreen} options={{ tabBarLabel: t('myPosts') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile') }} />
    </Tab.Navigator>
  );
};

// App navigator component
const AppNavigator = () => {
  const { colors } = useTheme();
  return (
    <ReferenceDataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
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
  const { isActive, message, estimatedReturn } = useMaintenance();
  const { colors, isDark } = useTheme();

  if (isActive) {
    return <MaintenanceOverlay message={message} estimatedReturn={estimatedReturn} />;
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={getNavigationTheme(colors, isDark)} fallback={<Text>Loading...</Text>}>
      {isSignedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// Renders once ThemeProvider has resolved the active scheme - keeps the status
// bar and navigation chrome in sync with it (including manual overrides that
// differ from the OS setting, which plain style="auto" can't express).
const AppShell = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <RootNavigator />
    </>
  );
};

// Main App component
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const systemScheme = useColorScheme();

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
    // Renders before ThemeProvider mounts, so it follows the raw OS scheme
    // directly rather than useTheme() (which isn't available yet).
    const initColors = systemScheme === 'dark' ? darkColors : lightColors;
    return (
      <View style={[styles.loadingContainer, { backgroundColor: initColors.background }]}>
        <ActivityIndicator size="large" color={initColors.primary} />
        <Text style={[styles.loadingText, { color: initColors.textSecondary }]}>Initializing App...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MaintenanceProvider>
          <AuthProvider>
            <SafeAreaProvider>
              <AppShell />
            </SafeAreaProvider>
          </AuthProvider>
        </MaintenanceProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
