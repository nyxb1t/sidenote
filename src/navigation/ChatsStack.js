/**
 * ChatsStack.js
 *
 * Stack navigator for the "Chats" tab.
 * ThreadsScreen (index) → ChatScreen (detail)
 *
 * This lets the tab bar persist across both screens while still allowing
 * navigation.goBack() in ChatScreen to pop back to the threads list.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ThreadsScreen from '../screens/ThreadsScreen';
import ChatScreen    from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

const ChatsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Threads" component={ThreadsScreen} />
    <Stack.Screen name="Chat"    component={ChatScreen}    />
  </Stack.Navigator>
);

export default ChatsStack;
