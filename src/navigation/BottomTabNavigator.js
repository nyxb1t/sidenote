import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

import HomeScreen    from '../screens/HomeScreen';
import ChatsStack    from './ChatsStack';
import NotesStack    from './NotesStack';
import ProfileStack  from './ProfileStack';


const Tab = createBottomTabNavigator();

const TabIcon = ({ name, label, focused }) => (
  <View style={styles.iconWrapper}>
    <Ionicons
      name={focused ? name.replace('-outline', '') : name}
      size={22}
      color={focused ? Colors.yellow : Colors.textMuted}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" label="home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-outline" label="chats" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesStack}

        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="document-text-outline" label="notes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" label="profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceHigh,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    // No fixed height — React Navigation reads safeAreaInsets from SafeAreaProvider
    // and adds the correct bottom padding for system nav bars automatically
    paddingTop: 8,
    paddingBottom: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: Colors.yellow,
    fontWeight: '600',
  },
});

export default BottomTabNavigator;
