/**
 * NotesStack.js
 *
 * Stack navigator for the "Notes" tab.
 * NotesScreen (archive index) → TopicNotesScreen (notes in a topic) → NoteDetailScreen
 *
 * This keeps the tab bar visible on all three levels while allowing
 * navigation.goBack() to work naturally at each level.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NotesScreen      from '../screens/NotesScreen';
import TopicNotesScreen from '../screens/TopicNotesScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';

const Stack = createNativeStackNavigator();

const NotesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotesArchive"  component={NotesScreen}      />
    <Stack.Screen name="TopicNotes"    component={TopicNotesScreen} />
    <Stack.Screen name="NoteDetail"    component={NoteDetailScreen} />
  </Stack.Navigator>
);

export default NotesStack;
