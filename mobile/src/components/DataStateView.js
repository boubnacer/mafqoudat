/**
 * Data State View
 * Shared empty/error block for data screens, so every fetch resolves to exactly
 * one of: data, this in an "empty" reading, or this in an "error" reading with a
 * Retry action. Doesn't manage its own flex sizing - the caller wraps it in
 * whatever container (full-screen centerContainer, FlatList ListEmptyComponent, etc.)
 * fits that screen's layout.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DataStateView = ({ variant = 'empty', message, actionLabel, onAction, isRTL }) => (
  <View style={styles.container}>
    <Text style={[styles.message, variant === 'error' && styles.errorMessage, isRTL && styles.textRTL]}>
      {message}
    </Text>
    {onAction ? (
      <TouchableOpacity
        style={[styles.button, variant === 'error' && styles.errorButton]}
        onPress={onAction}
      >
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#c62828',
  },
  textRTL: {
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  errorButton: {
    backgroundColor: '#c62828',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default DataStateView;
