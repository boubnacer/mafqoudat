/**
 * Maintenance Overlay
 * Full-screen, blocking notice shown whenever the server's maintenance-mode
 * middleware 503s a request (see app/api/apiService.js). Retry just re-fires a
 * cheap public GET - if maintenance has been lifted, the response interceptor's
 * success handler clears the shared MaintenanceContext state automatically and
 * this overlay unmounts; if it hasn't, the same 503 re-arrives and nothing changes.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import apiClient from '../app/api/apiService';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';

const MaintenanceOverlay = ({ message, estimatedReturn }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await apiClient.get('/countries', { params: { active: true } });
    } catch (error) {
      // Still down - the interceptor already re-applied the maintenance state.
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{t('maintenanceModeTitle')}</Text>
        <Text style={[styles.message, isRTL && styles.textRTL]}>
          {message || t('maintenanceModeDefaultMessage')}
        </Text>
        {estimatedReturn ? (
          <Text style={[styles.estimatedReturn, isRTL && styles.textRTL]}>
            {t('estimatedReturnLabel', { time: estimatedReturn })}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} disabled={isRetrying}>
          {isRetrying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  estimatedReturn: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  textRTL: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    minWidth: 140,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default MaintenanceOverlay;
