import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyEntitlements, syncEntitlements } from '../services/monetizationService';
import {
  initRevenueCatFromStorage,
  getOfferings,
  purchasePackage,
  restorePurchases,
  mapPackageToPlan,
  isRevenueCatConfigured,
} from '../services/revenueCatService';
import Colors from '../theme/colors';

const CANONICAL_PLANS = [
  {
    id: 'free',
    name: 'FREE',
    priceText: '₹0 / month',
    price: 0,
    credits: 10,
    features: [
      '10 AI credits/month',
      '3 lessons/month',
      '3 quizzes/month',
      'Max 5 quiz questions',
      'Session memory',
    ],
  },
  {
    id: 'basic',
    name: 'BASIC',
    priceText: '₹199 / month',
    price: 199,
    credits: 50,
    features: [
      '50 AI credits/month',
      '10 lessons/month',
      'Credit-based quizzes',
      'Max 10 quiz questions',
      'Recent 30-day memory',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    priceText: '₹399 / month',
    price: 399,
    credits: 120,
    isRecommended: true,
    features: [
      '120 AI credits/month',
      '25 lessons/month',
      'Credit-based quizzes',
      'Max 20 quiz questions',
      'Persistent learner profile',
      'Advanced personalization/analytics',
    ],
  },
  {
    id: 'advanced',
    name: 'ADVANCED',
    priceText: '₹699 / month',
    price: 699,
    credits: 300,
    features: [
      '300 AI credits/month',
      '60 lessons/month',
      'Credit-based quizzes',
      'Max 30 quiz questions',
      'Full evolving learner model',
      'Full adaptive learning',
    ],
  },
];

const PaywallScreen = ({ navigation }) => {
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [entitlements, setEntitlements] = useState(null);
  const [rcPackages, setRcPackages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // 1. Load authoritative backend entitlements
        const ent = await getMyEntitlements();
        if (isMounted && ent) {
          setEntitlements(ent);
          if (ent.plan && ent.plan !== 'free') {
            setSelectedPlanId(ent.plan);
          }
        }

        // 2. Initialize RevenueCat with stored auth user session
        await initRevenueCatFromStorage();

        // 3. Fetch offerings from RevenueCat
        const offerings = await getOfferings();
        if (isMounted && offerings?.current?.availablePackages) {
          const map = {};
          for (const pkg of offerings.current.availablePackages) {
            const mappedPlan = mapPackageToPlan(pkg);
            if (mappedPlan) {
              map[mappedPlan] = pkg;
            }
          }
          setRcPackages(map);
        }
      } catch (err) {
        console.warn('[PaywallScreen] Error loading data:', err?.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentPlan = (entitlements?.plan || 'free').toLowerCase();
  const creditsRemaining = entitlements?.creditsRemaining ?? 10;
  const currentSelectedPlan = CANONICAL_PLANS.find((p) => p.id === selectedPlanId);
  const availablePackage = rcPackages[selectedPlanId] || null;

  const handlePurchase = async () => {
    if (isPurchasing || !availablePackage) return;

    setIsPurchasing(true);
    try {
      const result = await purchasePackage(availablePackage);
      if (result.userCancelled) {
        return;
      }

      if (!result.success) {
        Alert.alert('Purchase Failed', result.error || 'Failed to complete in-app purchase.');
        return;
      }

      // Sync backend with RevenueCat verified entitlements (never client-trusting)
      try {
        const updated = await syncEntitlements();
        if (updated) {
          setEntitlements(updated);
        }
      } catch (syncErr) {
        console.warn('[PaywallScreen] Sync fallback:', syncErr?.message);
        const fallback = await getMyEntitlements();
        if (fallback) setEntitlements(fallback);
      }

      Alert.alert(
        'Subscription Active',
        `You have successfully subscribed to ${currentSelectedPlan?.name || 'the plan'}. Enjoy your upgraded experience!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Purchase Error', err.message || 'An unexpected error occurred during purchase.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      const res = await restorePurchases();
      if (!res.success) {
        Alert.alert('Restore Failed', res.error || 'Unable to restore purchases.');
        return;
      }

      // Sync backend
      let updatedEnt = null;
      try {
        updatedEnt = await syncEntitlements();
      } catch {
        updatedEnt = await getMyEntitlements();
      }

      if (updatedEnt) {
        setEntitlements(updatedEnt);
      }

      const active = res.customerInfo?.entitlements?.active || {};
      if (Object.keys(active).length > 0) {
        Alert.alert('Purchases Restored', 'Your previous subscription has been restored successfully.');
      } else {
        Alert.alert('No Active Purchases', 'No active subscription was found to restore for this account.');
      }
    } catch (err) {
      Alert.alert('Restore Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Determine button state and label
  const isCurrent = selectedPlanId === currentPlan;
  const isFree = selectedPlanId === 'free';
  const hasPackage = Boolean(availablePackage);

  let buttonDisabled = true;
  let buttonLabel = 'Purchases unavailable';

  if (isPurchasing) {
    buttonLabel = 'Processing purchase...';
    buttonDisabled = true;
  } else if (isCurrent) {
    buttonLabel = 'Already on this plan';
    buttonDisabled = true;
  } else if (isFree) {
    buttonLabel = 'Default Free Plan';
    buttonDisabled = true;
  } else if (hasPackage) {
    buttonLabel = `Subscribe for ${currentSelectedPlan?.priceText || ''}`;
    buttonDisabled = false;
  } else {
    buttonLabel = 'Purchases unavailable / Coming soon';
    buttonDisabled = true;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.currentPlanPill}>
          <Text style={styles.currentPlanPillText}>
            CURRENT: <Text style={{ color: Colors.yellow, fontWeight: '700' }}>{currentPlan.toUpperCase()}</Text> ({creditsRemaining} credits)
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.yellow} />
            ) : (
              <Text style={styles.restoreBtnText}>Restore</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SIDENOTE PRO VISIBILITY HERO ── */}
        <View style={styles.proHero}>
          <View style={styles.proPill}>
            <Ionicons name="sparkles" size={13} color="#000" />
            <Text style={styles.proPillText}>SideNote Pro</Text>
          </View>
          <Text style={styles.title}>Unlock your full learning potential.</Text>
          <Text style={styles.subtitle}>
            SideNote Pro gives you deep personalization, higher limits, and priority AI generations.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={Colors.yellow} />
            <Text style={styles.loaderText}>Loading plan details...</Text>
          </View>
        ) : null}

        {/* ── 4 CANONICAL PUBLIC PLANS ── */}
        {CANONICAL_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isThisCurrent = currentPlan === plan.id;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                isThisCurrent && styles.planCardCurrent,
              ]}
              onPress={() => setSelectedPlanId(plan.id)}
              activeOpacity={0.8}
            >
              {isThisCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentText}>CURRENT PLAN</Text>
                </View>
              )}
              {plan.isRecommended && !isThisCurrent && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <Text style={[styles.planTitle, isSelected && { color: Colors.yellow }]}>
                  {plan.name}
                </Text>
                <Text style={styles.planPrice}>{plan.priceText}</Text>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feat, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.yellow} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── FOOTER CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            buttonDisabled && styles.subscribeBtnDisabled,
          ]}
          disabled={buttonDisabled}
          onPress={handlePurchase}
          activeOpacity={0.85}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.subscribeText, buttonDisabled && styles.subscribeTextDisabled]}>
              {buttonLabel}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          In-app subscriptions are billed via Google Play / App Store and renew automatically. Cancel anytime.
        </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  currentPlanPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currentPlanPillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restoreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  restoreBtnText: {
    color: Colors.yellow,
    fontSize: 13,
    fontWeight: '600',
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
  proHero: {
    marginBottom: 20,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  proPillText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  loaderText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.04)',
  },
  planCardCurrent: {
    borderColor: 'rgba(232,212,77,0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planPrice: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subscribeBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  subscribeBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subscribeText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  subscribeTextDisabled: {
    color: Colors.textMuted,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default PaywallScreen;
