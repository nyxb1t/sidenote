/**
 * ChatStack.js
 *
 * Stack navigator for the "Chat" tab.
 * Threads (default) → Chat (detail)
 *
 * unmountOnBlur is set on this tab in BottomTabNavigator so the stack
 * always resets to Threads whenever the user re-taps the Chat tab icon.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ThreadsScreen from '../screens/ThreadsScreen';
import ChatScreen    from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

const ChatStack = () => (
  <Stack.Navigator
    initialRouteName="Threads"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Threads" component={ThreadsScreen} />
    <Stack.Screen name="Chat"    component={ChatScreen}    />
  </Stack.Navigator>
);

export default ChatStack;
