import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_700Bold, Cairo_400Regular } from '@expo-google-fonts/cairo';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { validateEnv } from './src/config/validateEnv';
import { navigationRef } from './src/navigation/navigationRef';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MaintenanceProvider, useMaintenance } from './src/context/MaintenanceContext';
import { ReferenceDataProvider } from './src/context/ReferenceDataContext';
import { OnboardingProvider, useOnboarding } from './src/context/OnboardingContext';
import { lightColors, darkColors } from './src/theme/tokens';
import { getNavigationTheme } from './src/theme/navigationTheme';
import { useTranslation } from './src/utils/translations';
import MaintenanceOverlay from './src/components/MaintenanceOverlay';
import OfflineBanner from './src/components/OfflineBanner';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import CountrySelectionScreen from './src/screens/CountrySelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
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

// Pre-country navigator: Onboarding (first launch only) -> Welcome (country/language
// landing). Only mounted before a country has ever been picked - once it has
// (RootNavigator's hasCountry), AppNavigator takes over even for a signed-out
// user (guest browsing), so Login/SignUp/CountrySelection live there instead.
const AuthNavigator = () => {
  const { colors } = useTheme();
  const { hasSeenOnboarding } = useOnboarding();
  return (
    <Stack.Navigator
      initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
};

// App navigator component: Home (and everything reachable from it) is on a plain
// stack now - no bottom tab bar. Each screen renders its own AppHeader: Home shows
// the brand logo + overflow menu, every other screen shows a back button + page
// title (see AppHeader's onBack prop) with New Post/My Posts/Profile now reached
// via the overflow menu (HeaderMenu) instead of tab buttons. Login/SignUp/
// CountrySelection live in this same stack so a guest can reach them from any
// screen without a navigator swap. Screens that require a session (NewPost,
// MyPosts, Profile) check isSignedIn themselves and redirect straight to Login
// (with a notice banner via AuthContext's loginNotice) instead of rendering their
// real content when it's false - mirrors client's ProtectedRoute. SettingsScreen
// stays guest-accessible; it only swaps its bottom button between Login/Logout.
const AppNavigator = () => {
  const { colors } = useTheme();
  return (
    <ReferenceDataProvider>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewPost" component={NewPostScreen} />
        <Stack.Screen name="MyPosts" component={MyPostsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PostsListScreen" component={PostsListScreen} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
        <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </ReferenceDataProvider>
  );
};

// Root navigator that handles auth/country state
const RootNavigator = () => {
  const { isLoading, isSignedIn, hasCountry } = useAuth();
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

  // A country pick (even without signing in) is enough to unlock guest
  // browsing - only a user who has never chosen one gets funneled through
  // AuthNavigator's Onboarding/Welcome first.
  const showAppShell = isSignedIn || hasCountry;

  return (
    <NavigationContainer ref={navigationRef} theme={getNavigationTheme(colors, isDark)} fallback={<Text>Loading...</Text>}>
      {showAppShell ? <AppNavigator /> : <AuthNavigator />}
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
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
  });

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

  if (fontError) {
    console.error('❌ Font loading failed:', fontError);
  }

  if (!isReady || (!fontsLoaded && !fontError)) {
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
            <OnboardingProvider>
              <SafeAreaProvider>
                <AppShell />
              </SafeAreaProvider>
            </OnboardingProvider>
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
