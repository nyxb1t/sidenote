import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

export default function TopicSelectionScreen({ navigation }) {
  const topics = ['Dynamic Programming', 'Process Scheduling', 'Sorting Algorithms', 'Graphs'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Topic to Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {topics.map((topic, i) => (
          <TouchableOpacity
            key={i}
            style={styles.topicCard}
            onPress={() => navigation.navigate('QuizScreen', { topic })}
          >
            <Text style={styles.topicText}>{topic}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  listContainer: { padding: 20, gap: 12 },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  topicText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '500' },
});
