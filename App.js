import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreenNative from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import SplashScreen from './src/screens/SplashScreen';
import AuthChoiceScreen from './src/screens/AuthChoiceScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import CreditTopupScreen from './src/screens/CreditTopupScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import Colors from './src/theme/colors';

// Prevent native splash screen from hiding until resources are loaded
SplashScreenNative.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PatrickHand: require('./assets/fonts/PatrickHand-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreenNative.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0B0B0B" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: Colors.yellow,
            background: '#0B0B0B',
            card: Colors.surfaceHigh,
            text: Colors.textPrimary,
            border: Colors.border,
            notification: Colors.coral,
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#0B0B0B' },
          }}
          initialRouteName="SplashScreen"
        >
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="AuthChoiceScreen" component={AuthChoiceScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="SignInScreen" component={SignInScreen} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          <Stack.Screen name="App" component={BottomTabNavigator} />
          <Stack.Screen name="PaywallScreen" component={PaywallScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="CreditTopupScreen" component={CreditTopupScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
