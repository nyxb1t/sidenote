import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { globalState, addTestResult } from '../data/globalState';
import { generateQuiz, submitQuizAttempt, trackLearnerEvent } from '../services/aiService';
import Colors from '../theme/colors';

export default function QuizScreen({ navigation, route }) {
  const { topic, lesson_id } = route.params || { topic: 'General', lesson_id: null };
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // key: question index, value: selected option index
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (!lesson_id) {
      alert('No lesson ID provided');
      navigation.goBack();
      return;
    }
    const fetchQuiz = async () => {
      try {
        const result = await generateQuiz(lesson_id);
        const quizRow = result.data || result;
        setQuizId(quizRow.id);
        if (quizRow.content && quizRow.content.questions) {
          setQuestions(quizRow.content.questions);
        } else {
          setQuestions([]);
        }
      } catch (err) {
        alert(err.message || 'Error generating quiz');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [lesson_id]);

  const handleSelect = (idx) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: idx }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let correctCount = 0;
      const formattedAnswers = {};
      const mistakeTopics = [];
      
      questions.forEach((q, i) => {
        const selected = answers[i];
        formattedAnswers[q.id || i] = selected;
        if (q.type === 'mcq' && selected === q.correctIndex) {
          correctCount++;
        } else if (q.type === 'true_false' && (selected === 0) === q.correctAnswer) {
          correctCount++;
        } else {
          mistakeTopics.push(topic);
        }
      });
      
      const score = questions.length > 0 ? (correctCount / questions.length) : 0;
      setQuizScore(score);
      
      if (quizId) {
        await submitQuizAttempt(quizId, {
          answers: formattedAnswers,
          score: score,
          mistake_topics: mistakeTopics
        });
      }

      await trackLearnerEvent({
        type: 'quiz_result',
        topic: topic,
        score: score,
        mistakeTopics: mistakeTopics
      });
      
      setFinished(true);
      
      addTestResult({
        id: Date.now().toString(),
        topic,
        score: `${Math.round(score * 100)}%`,
        date: new Date().toLocaleDateString(),
        questions: []
      });
      
    } catch (err) {
      alert(err.message || 'Error submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, {justifyContent: 'center', alignItems: 'center'}]} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.yellow} />
        <Text style={{color: Colors.textSecondary, marginTop: 16}}>Generating personalised quiz...</Text>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;
  const currentSelected = answers[currentIdx];
  const hasSelected = currentSelected !== undefined;

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
          currentQ ? (
            <>
              <Text style={styles.progressText}>Question {currentIdx + 1} of {questions.length}</Text>
              <Text style={styles.questionText}>{currentQ.question}</Text>
              
              {currentQ.type === 'true_false' ? (
                ['True', 'False'].map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionCard, currentSelected === i && styles.optionSelected]}
                    onPress={() => handleSelect(i)}
                  >
                    <Text style={[styles.optionText, currentSelected === i && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                (currentQ.options || []).map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionCard, currentSelected === i && styles.optionSelected]}
                    onPress={() => handleSelect(i)}
                  >
                    <Text style={[styles.optionText, currentSelected === i && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))
              )}

              {isLastQ ? (
                <TouchableOpacity 
                  style={[styles.submitBtn, (!hasSelected || isSubmitting) && styles.submitBtnDisabled]} 
                  onPress={handleSubmit} 
                  disabled={!hasSelected || isSubmitting}
                >
                  <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Answers'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.submitBtn, !hasSelected && styles.submitBtnDisabled]} 
                  onPress={handleNext} 
                  disabled={!hasSelected}
                >
                  <Text style={styles.submitBtnText}>Next Question</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={{color: Colors.textSecondary, textAlign: 'center'}}>No questions available.</Text>
          )
        ) : (
          <View style={styles.resultBox}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.yellow} />
            <Text style={styles.resultTitle}>Test Completed!</Text>
            <Text style={styles.resultText}>You scored {Math.round(quizScore * 100)}%.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
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
  progressText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 4 },
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
