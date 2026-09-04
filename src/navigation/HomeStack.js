import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ContinueLearningScreen from '../screens/ContinueLearningScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import SyllabusHistoryScreen from '../screens/SyllabusHistoryScreen';
import NotesLearningScreen from '../screens/NotesLearningScreen';
import NotesHistoryScreen from '../screens/NotesHistoryScreen';
import AssignmentChatScreen from '../screens/AssignmentChatScreen';
import AssignmentHistoryScreen from '../screens/AssignmentHistoryScreen';
import TopicSelectionScreen from '../screens/TopicSelectionScreen';
import QuizScreen from '../screens/QuizScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ContinueLearningScreen" component={ContinueLearningScreen} />
      <Stack.Screen name="SyllabusHistoryScreen" component={SyllabusHistoryScreen} />
      <Stack.Screen name="SyllabusScreen" component={SyllabusScreen} />
      <Stack.Screen name="NotesHistoryScreen" component={NotesHistoryScreen} />
      <Stack.Screen name="NotesLearningScreen" component={NotesLearningScreen} />
      <Stack.Screen name="AssignmentHistoryScreen" component={AssignmentHistoryScreen} />
      <Stack.Screen name="AssignmentChatScreen" component={AssignmentChatScreen} />
      <Stack.Screen name="TopicSelectionScreen" component={TopicSelectionScreen} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} />
    </Stack.Navigator>
  );
}
