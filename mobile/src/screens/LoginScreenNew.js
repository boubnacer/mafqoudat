import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthNew } from '../context/AuthContextNew';

const LoginScreenNew = ({ navigation }) => {
  const { signInWithGoogle, isLoading, error, clearError } = useAuthNew();
  const [isSigningIn, setIsSigningIn] = useState(false);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      console.log('🚀 Initiating Google Sign In from LoginScreenNew...');

      const result = await signInWithGoogle();

      if (result.success) {
        console.log('✅ Sign in successful, navigating to Home...');
        // Navigation will be handled by the main app component
        // based on the auth state change
      } else {
        console.log('❌ Sign in failed:', result.error);
        Alert.alert('Sign In Failed', result.error);
      }
    } catch (error) {
      console.error('❌ Unexpected error during sign in:', error);
      Alert.alert('Error', 'An unexpected error occurred during sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Mafqoudat</Text>
            <Text style={styles.subtitle}>Find what you've lost</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.welcomeText}>
              Welcome back! Sign in to continue
            </Text>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                (isLoading || isSigningIn) && styles.disabledButton
              ]}
              onPress={handleGoogleSignIn}
              disabled={isLoading || isSigningIn}
            >
              {isSigningIn ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Debug Info */}
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>Loading: {isLoading.toString()}</Text>
                <Text style={styles.debugText}>Signing In: {isSigningIn.toString()}</Text>
                {error && <Text style={styles.debugError}>Error: {error}</Text>}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  welcomeText: {
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0,
    elevation: 0,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  debugError: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreenNew;
