import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { lightColors, darkColors, colorTokens, fontFamilies } from './src/theme/tokens';
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
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  NewPost: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  MyPosts: { focused: 'list', unfocused: 'list-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
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

// Bottom tab navigator: the four primary authenticated destinations, plus two hidden
// tabs (PostsListScreen, PostDetailScreen) that keep the floating bar visible while
// browsing - see the comment above those Tab.Screens below. Edit/settings screens still
// push from the root stack (AppNavigator below), outside the tabs entirely, since hiding
// the bar for those focused, form-style flows is the expected pattern.
//
// Styled as a floating capsule (surfaceRaised, full pill radius, elevation) using the
// same brand tokens as the web app's theme.custom - the active tab renders as an
// ink-filled pill with its icon + label inline (contrast text via surfaceRaised, mirroring
// the solid-fill status tag pattern from the post card), inactive tabs are icon-only. NewPost
// (the primary action) still renders as a raised brandPrimary FAB circle instead of a plain
// icon, so it reads as the one action distinct from the three destinations around it.
const MainTabs = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;

  // Labels rendered inline inside the active tab's pill (see tabBarIcon below) -
  // keyed the same way as the tabBarLabel options passed to each Tab.Screen further down.
  const TAB_LABELS = {
    Home: t('home'),
    MyPosts: t('myPosts'),
    Profile: t('profile'),
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      // 'history' (not the default 'firstRoute') so goBack() from a hidden tab
      // (PostsListScreen/PostDetailScreen) returns to whichever tab it was actually
      // opened from - Home, MyPosts, or wherever the header menu's Browse was tapped -
      // instead of always landing on Home regardless of where the user came from.
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.brandPrimary,
        tabBarInactiveTintColor: `${tokens.ink}B3`,
        tabBarHideOnKeyboard: true,
        // Own label rendered inline inside the active pill (tabBarIcon below) instead
        // of the library's default stacked icon-over-label layout.
        tabBarShowLabel: false,
        // Deliberately NOT position:'absolute' - bottom-tabs lays the bar out as a
        // normal flex sibling of the screen container, so the margin below reserves
        // real space and screens are never hidden behind the floating card. Using
        // absolute positioning here would overlay it on top of every screen's content.
        tabBarStyle: {
          marginHorizontal: 16,
          marginBottom: insets.bottom + 12,
          height: BAR_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: PILL_RADIUS,
          backgroundColor: tokens.surfaceRaised,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.12,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'NewPost') {
            return (
              <View
                style={[
                  tabBarStyles.fab,
                  { backgroundColor: tokens.brandPrimary, shadowColor: tokens.brandPrimary },
                ]}
              >
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </View>
            );
          }
          // PostsListScreen/PostDetailScreen (below) are hidden tabs - present so the
          // floating bar stays mounted and visible while browsing into them, but not
          // in TAB_ICONS since they never render a tab bar button of their own.
          const icon = TAB_ICONS[route.name];
          if (!icon) return null;
          if (focused) {
            return (
              <View style={[tabBarStyles.activePill, { backgroundColor: tokens.ink }]}>
                <Ionicons name={icon.focused} size={18} color={tokens.surfaceRaised} />
                <Text style={[tabBarStyles.activeLabel, { color: tokens.surfaceRaised }]}>
                  {TAB_LABELS[route.name]}
                </Text>
              </View>
            );
          }
          return (
            <View style={tabBarStyles.inactiveIconWrap}>
              <Ionicons name={icon.unfocused} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen
        name="NewPost"
        component={NewPostScreen}
        options={{ tabBarLabel: () => null }}
      />
      <Tab.Screen name="MyPosts" component={MyPostsScreen} options={{ tabBarLabel: t('myPosts') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile') }} />

      {/* Hidden tabs: reachable via navigation.navigate() from anywhere inside MainTabs
          (Home's "see all", HeaderMenu's Browse section, MyPosts' post rows, ...) but
          not shown as a tab bar button - this is what keeps the floating bottom bar
          visible while browsing posts/post detail instead of it disappearing the way
          a plain stack push would hide it. backBehavior="history" above means goBack()
          from either of these returns to whichever tab/screen was focused before, so
          PostsListScreen/PostDetailScreen's own back buttons keep working unchanged. */}
      <Tab.Screen
        name="PostsListScreen"
        component={PostsListScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="PostDetailScreen"
        component={PostDetailScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
};

// Full pill/capsule shape - deliberately not part of radiusTokens' 8px-based
// sm/md/lg/xl scale, since a capsule needs "half of whatever the height ends
// up being", not a fixed step. 999 is the standard RN trick for that.
const PILL_RADIUS = 999;
const BAR_HEIGHT = 64;

const tabBarStyles = StyleSheet.create({
  inactiveIconWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: PILL_RADIUS,
  },
  activeLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    marginStart: 6,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

// App navigator component: MainTabs (Home etc.) is reachable here whether or
// not the user is signed in (guest browsing) - Login/SignUp/CountrySelection
// live in this same stack so a guest can reach them from any tab without a
// navigator swap. Screens that require a session (NewPost, MyPosts, Profile)
// check isSignedIn themselves and redirect straight to Login (with a notice
// banner via AuthContext's loginNotice) instead of rendering their real
// content when it's false - mirrors client's ProtectedRoute. SettingsScreen
// stays guest-accessible; it only swaps its bottom button between Login/Logout.
const AppNavigator = () => {
  const { colors } = useTheme();
  return (
    <ReferenceDataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        {/* PostsListScreen/PostDetailScreen now live inside MainTabs (as hidden tabs)
            so the floating bottom bar stays visible while browsing - see MainTabs above. */}
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
