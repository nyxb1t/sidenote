/**
 * ProfileStack.js
 *
 * Stack navigator for the "Profile" tab.
 * ProfileScreen (main) → SettingsScreen (accessed via ⚙️ icon)
 *
 * Follows the same pattern as ChatsStack and NotesStack — tab bar
 * persists while still allowing navigation.goBack() from Settings.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen  from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import CreditTopupScreen from '../screens/CreditTopupScreen';
import TestResultDetailScreen from '../screens/TestResultDetailScreen';

const Stack = createNativeStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileScreen"          component={ProfileScreen} />
    <Stack.Screen name="SettingsScreen"         component={SettingsScreen} />
    <Stack.Screen name="PaywallScreen"          component={PaywallScreen} />
    <Stack.Screen name="CreditTopupScreen"      component={CreditTopupScreen} />
    <Stack.Screen name="TestResultDetailScreen" component={TestResultDetailScreen} />
  </Stack.Navigator>
);

export default ProfileStack;
