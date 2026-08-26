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

const Stack = createNativeStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Settings"    component={SettingsScreen} />
  </Stack.Navigator>
);

export default ProfileStack;
