/**
 * Top-level render-error boundary. Without this, a single uncaught error
 * anywhere in the tree (a bad API shape, a null a screen didn't guard
 * against) took the whole app down to a native crash instead of a recoverable
 * screen - the difference between one bad screen and a Play Console crash-
 * rate hit.
 *
 * Split in two because a class component (the only kind that can implement
 * componentDidCatch/getDerivedStateFromError - there is no hook equivalent)
 * can't call hooks itself: ErrorBoundary just tracks the error, ErrorFallback
 * is the themed/translated screen it renders instead of the crashed subtree.
 * Mounted inside every provider (see App.js), so the fallback can safely read
 * theme/language/translation context - only the subtree below this boundary
 * unmounts on a catch, never its ancestors.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { recordError } from '../utils/crashReporting';

const ErrorFallback = ({ onTryAgain }) => {
  const { isDark } = useTheme();
  const { currentLanguage, canRestartNatively, restartApp } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const [isRestarting, setIsRestarting] = React.useState(false);
  const styles = createStyles(tokens, isRTL);

  const handlePress = async () => {
    if (!canRestartNatively) {
      onTryAgain();
      return;
    }
    setIsRestarting(true);
    const ok = await restartApp();
    if (!ok) onTryAgain();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('crashScreenTitle')}</Text>
      <Text style={styles.message}>{t('crashScreenMessage')}</Text>
      <TouchableOpacity
        style={[styles.button, isRestarting && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isRestarting}
        activeOpacity={0.85}
      >
        {isRestarting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {canRestartNatively ? t('reopenAppNow') : t('retry')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
    recordError(error);
  }

  // Only reached when a native restart isn't possible (Expo Go). Re-renders
  // the crashed subtree fresh; if the same bad state caused it, it will
  // simply catch again - a best-effort recovery, not a guarantee.
  handleTryAgain = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onTryAgain={this.handleTryAgain} />;
    }
    return this.props.children;
  }
}

const createStyles = (tokens, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      textAlign: 'center',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      marginBottom: 10,
    },
    message: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 21,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      marginBottom: 26,
    },
    button: {
      minWidth: 160,
      height: 50,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: '#FFFFFF',
    },
  });

export default ErrorBoundary;
