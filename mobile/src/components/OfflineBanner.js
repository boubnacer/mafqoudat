/**
 * Offline Banner
 * Slim, non-blocking strip shown app-wide whenever NetInfo reports no connection.
 * `isInternetReachable` starts out `null` (undetermined) on cold start, so only
 * an explicit `false` on either field counts as offline - otherwise every launch
 * would flash the banner for a moment before NetInfo finishes its first check.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';

const OfflineBanner = () => {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={[styles.text, isRTL && styles.textRTL]}>{t('offlineMessage')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 999,
    backgroundColor: '#c62828',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'center',
  },
});

export default OfflineBanner;
