import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../theme/colors';

const { width } = Dimensions.get('window');

const STAGES = {
  INTRO: 1,
  QUESTIONNAIRE: 2,
  MOTIVATION: 3,
};

const QUESTIONS = [
  {
    id: 'stage',
    question: "What stage are you in?",
    type: 'options',
    options: ["School", "College", "Postgrad", "Other"],
  },
  {
    id: 'subject',
    question: "What are you studying right now?",
    type: 'input_chips',
    chips: ["DSA", "OS", "DBMS", "Web Dev", "Exams"],
    optional: true,
  },
  {
    id: 'goal',
    question: "What’s your goal?",
    type: 'options',
    options: ["Crack exams", "Build projects", "Learn concepts", "Revise quickly"],
  },
  {
    id: 'learning_style',
    question: "How do you understand best?",
    type: 'options',
    options: ["Visual explanations", "Step-by-step logic", "Examples", "Practice questions"],
  },
  {
    id: 'depth',
    question: "How deep do you want explanations?",
    type: 'options',
    options: ["Quick summary", "Balanced", "Deep dive"],
  },
  {
    id: 'frequency',
    question: "How often will you study?",
    type: 'options',
    options: ["Daily", "Few times a week", "Occasionally"],
  },
  {
    id: 'struggle',
    question: "What do you struggle with the most?",
    type: 'options',
    options: ["Understanding concepts", "Remembering", "Applying in problems", "Staying consistent"],
  }
];

const OnboardingScreen = ({ navigation }) => {
  const [stage, setStage] = useState(STAGES.INTRO);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [subjectInput, setSubjectInput] = useState('');

  useEffect(() => {
    if (QUESTIONS[qIndex]?.type === 'input_chips') {
      setSubjectInput(answers[QUESTIONS[qIndex].id] || '');
    }
  }, [qIndex, stage]);

  const handleSkip = () => {
    navigation.replace('App');
  };

  const goBack = () => {
    if (stage === STAGES.QUESTIONNAIRE) {
      if (qIndex > 0) {
        setQIndex(qIndex - 1);
      } else {
        setStage(STAGES.INTRO);
      }
    } else if (stage === STAGES.MOTIVATION) {
      setStage(STAGES.QUESTIONNAIRE);
      setQIndex(QUESTIONS.length - 1);
    }
  };

  const goNext = () => {
    if (stage === STAGES.INTRO) {
      setStage(STAGES.QUESTIONNAIRE);
    } else if (stage === STAGES.QUESTIONNAIRE) {
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        setStage(STAGES.MOTIVATION);
      }
    } else if (stage === STAGES.MOTIVATION) {
      navigation.replace('App');
    }
  };

  const handleOptionSelect = (option) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[qIndex].id]: option }));
    setTimeout(goNext, 300); // Small delay for visual feedback
  };

  const handleChipSelect = (chip) => {
    setSubjectInput(chip);
    setAnswers(prev => ({ ...prev, [QUESTIONS[qIndex].id]: chip }));
  };

  const renderIntro = () => (
    <View style={styles.centerContainer}>
      <TouchableOpacity onPress={handleSkip} style={styles.skipButtonMotivation}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Welcome to SideNote ✨</Text>
      <View style={styles.spacer} />
      <Text style={styles.paragraph}>
        This isn’t just another study app.{"\n"}
        Think of it as your personal notebook that actually teaches you.
      </Text>
      <View style={styles.spacerSmall} />
      <Text style={styles.paragraph}>
        Ask anything. Learn your way.{"\n"}
        No more boring explanations.
      </Text>
      
      <View style={styles.bottomFixed}>
        <TouchableOpacity style={styles.primaryButton} onPress={goNext} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Let’s set this up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuestionnaire = () => {
    const currentQ = QUESTIONS[qIndex];
    return (
      <View style={styles.qContainer}>
        {/* Header */}
        <View style={styles.qHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backButtonContainer}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>{qIndex + 1} / {QUESTIONS.length}</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButtonContainer}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.questionTitle}>{currentQ.question}</Text>

        {currentQ.type === 'input_chips' && (
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="E.g. Machine Learning, React Native"
              placeholderTextColor={Colors.textMuted}
              value={subjectInput}
              onChangeText={setSubjectInput}
              autoFocus
            />
            <View style={styles.chipsContainer}>
              {currentQ.chips.map((chip, idx) => {
                const isSelected = subjectInput.toLowerCase().trim() === chip.toLowerCase().trim();
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleChipSelect(chip)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.bottomFixed}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setAnswers(prev => ({ ...prev, [currentQ.id]: subjectInput.trim() }));
                  goNext();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentQ.type === 'options' && (
          <View style={styles.optionsContainer}>
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.id] === option;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => handleOptionSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderMotivation = () => {
    const subject = answers['subject'] || "your goals";
    
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity onPress={goBack} style={styles.backButtonMotivation}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>You’re all set 🚀</Text>
        <View style={styles.spacer} />
        <Text style={styles.paragraph}>
          Your notebook is ready.{"\n"}
          Let’s start learning smarter.
        </Text>
        
        <View style={styles.spacerSmall} />
        <Text style={[styles.paragraph, { color: Colors.yellow, fontWeight: '600' }]}>
          Focusing on: {subject}
        </Text>

        <View style={styles.bottomFixed}>
          <TouchableOpacity style={styles.primaryButton} onPress={goNext} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {stage === STAGES.INTRO && renderIntro()}
        {stage === STAGES.QUESTIONNAIRE && renderQuestionnaire()}
        {stage === STAGES.MOTIVATION && renderMotivation()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  spacer: {
    height: 24,
  },
  spacerSmall: {
    height: 16,
  },
  paragraph: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  bottomFixed: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.yellow,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.surfaceHigh,
  },
  primaryButtonText: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButtonTextDisabled: {
    color: Colors.textMuted,
  },
  // Questionnaire Styles
  qContainer: {
    flex: 1,
    paddingTop: 12,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  skipButtonContainer: {
    padding: 8,
    marginRight: -8, // better hit slop alignment
  },
  backButtonContainer: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonMotivation: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 8,
  },
  skipButtonMotivation: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  questionTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  inputSection: {
    flex: 1,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.yellowDim,
    borderColor: Colors.yellow,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.yellowText,
    fontWeight: '700',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.yellow,
    backgroundColor: Colors.yellowDim,
  },
  optionText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: Colors.yellowText,
    fontWeight: '700',
  }
});

export default OnboardingScreen;
