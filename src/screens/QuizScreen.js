import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addTestResult } from '../data/globalState';
import Colors from '../theme/colors';

export default function QuizScreen({ navigation, route }) {
  const { topic } = route.params || { topic: 'General' };
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [finished, setFinished] = useState(false);

  const handleSubmit = () => {
    setFinished(true);
    addTestResult({
      id: Date.now().toString(),
      topic,
      score: selectedOpt === 0 ? '100%' : '0%',
      date: new Date().toLocaleDateString(),
      questions: [{
        q: 'What is the primary advantage of this concept?',
        options: ['Better time complexity', 'Less space complexity', 'Easier to code', 'None of the above'],
        userAnswer: selectedOpt,
        correctAnswer: 0
      }]
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topic} Quiz</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!finished ? (
          <>
            <Text style={styles.questionText}>What is the primary advantage of this concept?</Text>
            
            {['Better time complexity', 'Less space complexity', 'Easier to code', 'None of the above'].map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.optionCard, selectedOpt === i && styles.optionSelected]}
                onPress={() => setSelectedOpt(i)}
              >
                <Text style={[styles.optionText, selectedOpt === i && styles.optionTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.submitBtn, selectedOpt === null && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={selectedOpt === null}>
              <Text style={styles.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultBox}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.yellow} />
            <Text style={styles.resultTitle}>Test Completed!</Text>
            <Text style={styles.resultText}>Your answers have been evaluated and saved to your Test History.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('HomeStack')}>
              <Text style={styles.doneBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
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
  container: { padding: 20, gap: 16 },
  questionText: { color: Colors.textPrimary, fontSize: 20, fontWeight: '600', marginBottom: 12 },
  optionCard: { padding: 16, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { borderColor: Colors.yellow, backgroundColor: Colors.yellowDim },
  optionText: { color: Colors.textPrimary, fontSize: 16 },
  optionTextSelected: { color: Colors.yellowText, fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.yellow, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#1C1C1E', fontSize: 16, fontWeight: '700' },
  resultBox: { alignItems: 'center', padding: 32, gap: 12 },
  resultTitle: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700' },
  resultText: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  doneBtn: { backgroundColor: Colors.surfaceHigh, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  doneBtnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
