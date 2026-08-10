import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getStateFromPath } from '@react-navigation/core';
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
import { NotificationsProvider } from './src/context/NotificationsContext';
import { lightColors, darkColors } from './src/theme/tokens';
import { getNavigationTheme } from './src/theme/navigationTheme';
import { useTranslation } from './src/utils/translations';
import MaintenanceOverlay from './src/components/MaintenanceOverlay';
import OfflineBanner from './src/components/OfflineBanner';
import DirectionChangeDialog from './src/components/DirectionChangeDialog';
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
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { ActivityIndicator, View, StyleSheet, Text, Linking } from 'react-native';

// Runs once, at module evaluation, before anything renders - see validateEnv.js.
validateEnv();

const Stack = createNativeStackNavigator();

// Deep link / Universal Link (iOS) / App Link (Android) config. Only
// PostDetailScreen is mapped: it's the one screen a shared web URL
// (https://www.mafqoudat.com/dash/posts/:id - the same address the OG-card
// endpoint at server/routes/ogRoutes.js renders a real preview for) should
// open directly into. Every other https path is intentionally left
// unmapped - React Navigation ignores an unmatched URL rather than erroring,
// so those just open in the browser as before.
//
// The mafqoudat:// prefix is unrelated to this: MOBILE_OAUTH_CALLBACK_URL
// (config/api.js) already resolves mafqoudat://auth/callback directly via
// WebBrowser.openAuthSessionAsync's own promise, never through this linking
// config. Including it here is additive - "auth/callback" isn't in the
// screens map below, so this listener just ignores that URL - and it makes
// mafqoudat://dash/posts/<id> a working custom-scheme link too, which is
// useful for QR codes and testing before the native App/Universal Links
// config (app.config.js's associatedDomains/intentFilters, plus the
// .well-known files served by the web app) is fully live.
//
// This config only resolves a URL against whichever navigator is CURRENTLY
// mounted - it can't reach PostDetailScreen while AuthNavigator (no country/
// session yet) is what's showing. RootNavigator's deferred-link handling
// below covers that case: it captures the same URL independently and replays
// it once AppNavigator takes over, using getStateFromPath directly against
// this exact object so the two can never disagree on what counts as an
// openable post link.
const linking = {
  prefixes: ['mafqoudat://', 'https://mafqoudat.com', 'https://www.mafqoudat.com'],
  config: {
    screens: {
      PostDetailScreen: 'dash/posts/:id',
    },
  },
};

// Shared by both NavigationContainer's automatic resolution above and
// RootNavigator's manual capture below - returns a post id if (and only if)
// `url` is one this app treats as an openable post, else null.
const resolvePendingPostId = (url) => {
  if (!url) return null;
  const prefix = linking.prefixes.find((p) => url.startsWith(p));
  const path = prefix ? url.slice(prefix.length) : url;
  const state = getStateFromPath(path, linking.config);
  const route = state?.routes?.[0];
  return route?.name === 'PostDetailScreen' ? route.params?.id ?? null : null;
};

// Retries navigationRef.navigate until the container reports ready, rather
// than a single fixed delay: RootNavigator's effect below fires the instant
// AppNavigator mounts, and while that's typically enough for
// NavigationContainer to already be ready, there is no hard guarantee of it
// on every device/timing - the docs-recommended pattern for "navigate right
// after a navigator swap" is poll-until-ready, not a guessed timeout.
const navigateWhenReady = (screen, params, attemptsLeft = 20) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen, params);
    return;
  }
  if (attemptsLeft <= 0) return;
  setTimeout(() => navigateWhenReady(screen, params, attemptsLeft - 1), 50);
};

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
        {/* Both only linked from Settings while signed in - see SettingsScreen. */}
        <Stack.Screen name="BlockedUsersScreen" component={BlockedUsersScreen} />
        <Stack.Screen name="DeleteAccountScreen" component={DeleteAccountScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
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

  // A country pick (even without signing in) is enough to unlock guest
  // browsing - only a user who has never chosen one gets funneled through
  // AuthNavigator's Onboarding/Welcome first.
  const showAppShell = isSignedIn || hasCountry;

  // Deferred deep link: a post URL that opens/resumes the app while
  // AuthNavigator (no PostDetailScreen route registered) is what's mounted
  // would otherwise be silently dropped by the `linking` config above, since
  // that only resolves against the currently-active navigator. This captures
  // it independently and replays it the moment showAppShell flips true.
  //
  // Deliberately does nothing when showAppShell is ALREADY true at capture
  // time - NavigationContainer's own `linking` prop already resolves and
  // navigates correctly for that case (verified: getStateFromPath matches
  // dash/posts/:id against AppNavigator's registered screens), and also
  // re-firing here would risk a double-navigate.
  //
  // Session-scoped only, matching this codebase's existing convention for
  // pending navigation intent (see AuthContext's loginNotice): if the OS
  // kills the app before a country gets picked, the pending post is lost on
  // next launch rather than persisted - the same tradeoff loginNotice makes,
  // and disproportionate to add SecureStore/AsyncStorage persistence for.
  const showAppShellRef = useRef(showAppShell);
  const [pendingPostId, setPendingPostId] = useState(null);

  useEffect(() => {
    showAppShellRef.current = showAppShell;
  }, [showAppShell]);

  useEffect(() => {
    const captureIfDeferred = (url) => {
      // Read via the ref, not the `showAppShell` closed over at effect-setup
      // time (this effect's deps are intentionally empty - see below) - it
      // needs this listener's live value, not its value when first mounted.
      if (showAppShellRef.current) return;
      const id = resolvePendingPostId(url);
      if (id) setPendingPostId(id);
    };

    Linking.getInitialURL().then(captureIfDeferred);
    // Deliberately not in the dependency array: re-subscribing on every
    // showAppShell change would create a window, between unsubscribe and
    // resubscribe, where an incoming URL is missed entirely.
    const subscription = Linking.addEventListener('url', ({ url }) => captureIfDeferred(url));
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showAppShell || !pendingPostId) return;
    navigateWhenReady('PostDetailScreen', { id: pendingPostId });
    // Consumed once queued (not only once navigated - navigateWhenReady's own
    // retries handle the rare case navigationRef isn't ready yet): prevents
    // this from re-firing on a later showAppShell toggle within the same
    // session (e.g. sign out, then pick a country again).
    setPendingPostId(null);
  }, [showAppShell, pendingPostId]);

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
    <NavigationContainer
      ref={navigationRef}
      theme={getNavigationTheme(colors, isDark)}
      fallback={<Text>Loading...</Text>}
      linking={linking}
    >
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
      <DirectionChangeDialog />
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
            {/* Inside AuthProvider (it polls only while a session exists) and
                above both navigators, because AppHeader - which renders the
                bell - is mounted by screens in each of them. */}
            <NotificationsProvider>
              <OnboardingProvider>
                <SafeAreaProvider>
                  <AppShell />
                </SafeAreaProvider>
              </OnboardingProvider>
            </NotificationsProvider>
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
