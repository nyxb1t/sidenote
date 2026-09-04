import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

export default function TestResultDetailScreen({ navigation, route }) {
  const { test } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{test.topic} Result</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{test.score}</Text>
          <Text style={styles.dateText}>{test.date}</Text>
        </View>

        <Text style={styles.sectionTitle}>Questions Breakdown</Text>
        {test.questions.map((q, i) => {
          const isCorrect = q.userAnswer === q.correctAnswer;
          return (
            <View key={i} style={styles.qCard}>
              <View style={styles.qHeader}>
                <Text style={styles.qText}>Q{i + 1}. {q.q}</Text>
                <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={24} color={isCorrect ? Colors.yellow : Colors.coral} />
              </View>
              
              <View style={styles.answerBox}>
                <Text style={styles.answerLabel}>Your Answer:</Text>
                <Text style={[styles.answerText, { color: isCorrect ? Colors.yellow : Colors.coral }]}>
                  {q.userAnswer !== null ? q.options[q.userAnswer] : 'Skipped'}
                </Text>
              </View>
              
              {!isCorrect && (
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>Correct Answer:</Text>
                  <Text style={[styles.answerText, { color: Colors.yellow }]}>
                    {q.options[q.correctAnswer]}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
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
  container: { padding: 20, gap: 20 },
  scoreCard: { alignItems: 'center', padding: 24, backgroundColor: Colors.surfaceHigh, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  scoreLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { color: Colors.yellow, fontSize: 42, fontWeight: '700', marginVertical: 8 },
  dateText: { color: Colors.textMuted, fontSize: 14 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 8 },
  qCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  qText: { flex: 1, color: Colors.textPrimary, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  answerBox: { backgroundColor: Colors.bg, padding: 12, borderRadius: 8 },
  answerLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  answerText: { fontSize: 15, fontWeight: '500' },
});
