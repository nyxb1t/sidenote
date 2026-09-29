import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ToastAndroid,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { globalState } from '../data/globalState';
import Colors from '../theme/colors';

const PLANS = [
  { id: 'Free', name: 'FREE', lessons: 3, credits: 10, maxQuiz: 5, current: true },
  { id: 'Basic', name: 'BASIC', lessons: 10, credits: 50, maxQuiz: 10, current: false },
  { id: 'Pro', name: 'PRO', lessons: 25, credits: 120, maxQuiz: 20, current: false },
  { id: 'Advanced', name: 'ADVANCED', lessons: 60, credits: 300, maxQuiz: 30, current: false },
];

const CreditTopupScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = () => {
    if (!selectedPlan) return;

    setIsPurchasing(true);

    // Simulate success/RevenueCat for demo
    setTimeout(() => {
      globalState.currentPlan = selectedPlan.name;
      globalState.credits += selectedPlan.credits;
      
      setIsPurchasing(false);
      
      const message = `Subscribed to ${selectedPlan.name}!`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', message);
      }
      
      navigation.goBack();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose your plan.</Text>
        <Text style={styles.subtitle}>
          Unlock more lessons, more credits, and longer quizzes.
        </Text>

        {PLANS.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isCurrent = plan.name.toLowerCase() === globalState.currentPlan?.toLowerCase();

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.packCard,
                isSelected && styles.packCardSelected
              ]}
              onPress={() => !isCurrent && setSelectedPlan(plan)}
              activeOpacity={0.8}
            >
              {isCurrent && (
                <View style={styles.examBadge}>
                  <Text style={styles.examText}>CURRENT PLAN</Text>
                </View>
              )}
              <Text style={[styles.packTitle, (isSelected || isCurrent) && { color: Colors.yellow }]}>{plan.name}</Text>
              <Text style={styles.packDesc}>• {plan.lessons} lessons/month</Text>
              <Text style={styles.packDesc}>• {plan.credits} credits</Text>
              <Text style={styles.packDesc}>• Max {plan.maxQuiz} quiz questions</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.buyBtn,
            (!selectedPlan || isPurchasing) && styles.buyBtnDisabled
          ]}
          onPress={handlePurchase}
          disabled={!selectedPlan || isPurchasing}
        >
          <Text style={[
            styles.buyText,
            (!selectedPlan || isPurchasing) && styles.buyTextDisabled
          ]}>
            {isPurchasing ? 'Processing...' : (selectedPlan ? `Subscribe to ${selectedPlan.name}` : 'Select a plan')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', lineHeight: 36, marginBottom: 12 },
  subtitle: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 24 },
  packCard: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative' },
  packCardSelected: { borderColor: Colors.yellow, backgroundColor: 'rgba(232,212,77,0.05)' },
  examBadge: { position: 'absolute', top: -12, right: 20, backgroundColor: Colors.coral, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  examText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  packTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  packDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 4 },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  buyBtn: { backgroundColor: Colors.yellow, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  buyBtnDisabled: { backgroundColor: Colors.surfaceHigh },
  buyText: { color: '#000', fontSize: 16, fontWeight: '700' },
  buyTextDisabled: { color: Colors.textMuted }
});

export default CreditTopupScreen;
