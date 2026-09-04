import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

export default function SyllabusScreen({ navigation }) {
  const topics = ['Introduction to DSA', 'Arrays and Strings', 'Linked Lists', 'Trees & Graphs', 'Dynamic Programming'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syllabus</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <Text style={styles.sectionTitle}>Parsed Topics</Text>
        {topics.map((topic, i) => (
          <View key={i} style={styles.topicCard}>
            <Text style={styles.topicText}>{i + 1}. {topic}</Text>
          </View>
        ))}
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
  listContainer: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  topicCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  removeBtn: {
    marginTop: 20,
    backgroundColor: Colors.surfaceHigh,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeBtnText: {
    color: Colors.coral,
    fontWeight: '600',
    fontSize: 16,
  },
});
