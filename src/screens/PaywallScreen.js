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
  { id: 'Free', name: 'Free', credits: 20, desc: '20 credits/month\nAds included' },
  { id: 'Learner', name: 'Learner', credits: 100, desc: '100 credits/month\nNo ads' },
  { id: 'Scholar', name: 'Scholar', credits: 300, desc: '300 credits/month\nNo ads' },
  { id: 'Mastery', name: 'Mastery', credits: 1000, desc: 'Unlimited credits\nNo ads' },
];

const PaywallScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    
    if (selectedPlan.id === globalState.currentPlan) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Already on ${selectedPlan.name} plan`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Info', `Already on ${selectedPlan.name} plan`);
      }
      return;
    }

    setIsSubscribing(true);

    // Simulate success
    setTimeout(() => {
      globalState.currentPlan = selectedPlan.id;
      globalState.credits = selectedPlan.credits;
      
      setIsSubscribing(false);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`You're now on ${selectedPlan.name}`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', `You're now on ${selectedPlan.name}`);
      }
      
      navigation.goBack();
    }, 1000);
  };

  const isCurrentPlan = (planId) => globalState.currentPlan === planId;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
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
        <Text style={styles.title}>Unlock your full learning potential.</Text>
        <Text style={styles.subtitle}>
          SideNote uses AI credits to generate visual explanations, practice tests, and intelligent notes.
        </Text>

        {/* Value Props */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Unlimited custom notes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Premium visual generation</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Early access to new features</Text>
          </View>
        </View>

        {PLANS.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                isCurrent && styles.planCardCurrent
              ]}
              onPress={() => setSelectedPlan(plan)}
              activeOpacity={0.8}
            >
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentText}>CURRENT PLAN</Text>
                </View>
              )}
              {plan.id === 'Scholar' && !isCurrent && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}
              <Text style={[styles.planTitle, isSelected && { color: Colors.yellow }]}>{plan.name}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            (!selectedPlan || isSubscribing) && styles.subscribeBtnDisabled
          ]}
          onPress={handleSubscribe}
          disabled={!selectedPlan || isSubscribing}
        >
          <Text style={[
            styles.subscribeText,
            (!selectedPlan || isSubscribing) && styles.subscribeTextDisabled
          ]}>
            {isSubscribing ? 'Processing...' : (
              selectedPlan 
                ? (isCurrentPlan(selectedPlan.id) ? 'Already active' : `Subscribe to ${selectedPlan.name}`)
                : 'Select a plan'
            )}
          </Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Cancel anytime. Auto-renews monthly.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.05)',
  },
  planCardCurrent: {
    borderColor: Colors.primary,
    opacity: 0.8,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  planDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subscribeBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeBtnDisabled: {
    backgroundColor: Colors.surfaceHigh,
  },
  subscribeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  subscribeTextDisabled: {
    color: Colors.textMuted,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  }
});

export default PaywallScreen;
