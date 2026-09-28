import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyEntitlements } from '../services/monetizationService';
import Colors from '../theme/colors';

const PACKS = [
  { id: 'Pack50', name: 'Starter Pack', credits: 50, priceText: '₹99', desc: '50 one-time AI credits' },
  { id: 'Pack150', name: 'Standard Pack', credits: 150, priceText: '₹249', desc: '150 one-time AI credits' },
  { id: 'Pack300', name: 'Sprint Pack', credits: 300, priceText: '₹449', desc: '300 one-time AI credits' },
];

const CreditTopupScreen = ({ navigation }) => {
  const [selectedPackId, setSelectedPackId] = useState('Pack150');
  const [entitlements, setEntitlements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const ent = await getMyEntitlements();
        if (isMounted && ent) {
          setEntitlements(ent);
        }
      } catch (err) {
        console.warn('[CreditTopupScreen] Could not load entitlements:', err?.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const creditsRemaining = entitlements?.creditsRemaining ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.creditsBadge}>
          <Ionicons name="flash" size={14} color={Colors.yellow} />
          <Text style={styles.creditsBadgeText}>
            CURRENT CREDITS: <Text style={{ color: Colors.yellow, fontWeight: '700' }}>{creditsRemaining}</Text>
          </Text>
        </View>
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
        <Text style={styles.title}>Top up your credits.</Text>
        <Text style={styles.subtitle}>
          Running low? Get a one-time credit pack to keep generating lessons, visual breakdowns, and insights without changing your plan.
        </Text>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={Colors.yellow} />
            <Text style={styles.loaderText}>Loading balance...</Text>
          </View>
        ) : null}

        {PACKS.map((pack) => {
          const isSelected = selectedPackId === pack.id;

          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.packCard,
                isSelected && styles.packCardSelected,
              ]}
              onPress={() => setSelectedPackId(pack.id)}
              activeOpacity={0.8}
            >
              <View style={styles.packHeader}>
                <Text style={[styles.packTitle, isSelected && { color: Colors.yellow }]}>
                  {pack.name}
                </Text>
                <Text style={styles.packPrice}>{pack.priceText}</Text>
              </View>
              <Text style={styles.packDesc}>{pack.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── FOOTER CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.buyBtn, styles.buyBtnDisabled]}
          disabled={true}
        >
          <Text style={[styles.buyText, styles.buyTextDisabled]}>
            Coming soon (In-App Purchases)
          </Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>One-time credit packs will be available via in-app purchases.</Text>
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
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232,212,77,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,212,77,0.2)',
  },
  creditsBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
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
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loaderText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  packCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  packCardSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.04)',
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  packPrice: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700',
  },
  packDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buyBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buyBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buyText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  buyTextDisabled: {
    color: Colors.textMuted,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default CreditTopupScreen;
