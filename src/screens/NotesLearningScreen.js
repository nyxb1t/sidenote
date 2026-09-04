import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

export default function NotesLearningScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes Learning Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.aiBox}>
          <Text style={styles.aiText}>
            Hi! I'm explaining this concept exactly in the style of the notes you uploaded. Notice how I'm mimicking the bullet points and key takeaways just like you wrote them.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    padding: 20,
    gap: 20,
  },
  aiBox: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.yellow,
  },
  aiText: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  replaceBtn: {
    backgroundColor: Colors.surfaceHigh,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  replaceBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
