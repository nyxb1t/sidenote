import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchBackendLessons } from '../services/aiService';
import Colors from '../theme/colors';

export default function TopicSelectionScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchBackendLessons();
        if (!cancelled && result?.data) {
          setSessions(result.data);
        }
      } catch (e) {
        console.warn('Failed to fetch lessons', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Lesson to Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.yellow} style={{marginTop: 20}} />
        ) : (
          <>
            {sessions.map((session, i) => (
              <TouchableOpacity
                key={i}
                style={styles.topicCard}
                onPress={() => navigation.navigate('QuizScreen', { topic: session.topic, lesson_id: session.id })}
              >
                <Text style={styles.topicText}>{session.topic}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
            {sessions.length === 0 && (
              <Text style={{color: Colors.textMuted, textAlign: 'center', marginTop: 20}}>No lessons found. Generate a lesson first!</Text>
            )}
          </>
        )}
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
