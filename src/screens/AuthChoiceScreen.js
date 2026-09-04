import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

let GoogleSignin;
try {
  const GSI = require('@react-native-google-signin/google-signin');
  GoogleSignin = GSI.GoogleSignin;
  // Make sure to call configure early, or it can be called here
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
    offlineAccess: true,
  });
} catch (e) {
  // Ignored in Expo Go
}

const AuthChoiceScreen = ({ navigation }) => {
  // Mock function to determine if this is a first-time user
  // In a real app, this would check backend or local storage
  const checkIsFirstTimeUser = () => true;

  const handleAuthSuccess = () => {
    const isFirstTime = checkIsFirstTimeUser();
    if (isFirstTime) {
      navigation.replace('OnboardingScreen');
    } else {
      navigation.replace('App');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (!GoogleSignin) {
        console.warn('Google Sign-In is not available in Expo Go. Use a dev build.');
        handleAuthSuccess();
        return;
      }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google User Info:', userInfo);
      
      handleAuthSuccess();
    } catch (error) {
      console.log('Google Auth Error:', error);
    }
  };

  const handleSkip = () => {
    handleAuthSuccess();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SideNote</Text>
        <Text style={styles.subtitle}>your pocket notebook for learning</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleGoogleAuth}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={20} color="#1C1C1E" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('SignUpScreen')}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={20} color={Colors.textPrimary} style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Continue with Email</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        activeOpacity={0.8}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 140,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.yellow,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default AuthChoiceScreen;
