import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import Colors from './src/theme/colors';

// App flow: Splash → Onboarding → Main app
// In a real app this state would be persisted with AsyncStorage
// Phases: 'splash' | 'onboarding' | 'app'

export default function App() {
  const [phase, setPhase] = useState('splash');

  if (phase === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <SplashScreen onDone={() => setPhase('onboarding')} />
      </SafeAreaProvider>
    );
  }

  if (phase === 'onboarding') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <OnboardingScreen onDone={() => setPhase('app')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: Colors.yellow,
            background: Colors.bg,
            card: Colors.surfaceHigh,
            text: Colors.textPrimary,
            border: Colors.border,
            notification: Colors.coral,
          },
        }}
      >
        <BottomTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
