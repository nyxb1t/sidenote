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

const PACKS = [
  { id: 'Small', name: 'Small Pack', credits: 20, isExamSprint: false, desc: '20 credits' },
  { id: 'Medium', name: 'Medium Pack', credits: 50, isExamSprint: false, desc: '50 credits' },
  { id: 'Large', name: 'Large Pack', credits: 150, isExamSprint: false, desc: '150 credits' },
  { id: 'Exam', name: 'Exam Sprint', credits: 0, isExamSprint: true, desc: 'Unlock "exam mode" flag' },
];

const CreditTopupScreen = ({ navigation }) => {
  const [selectedPack, setSelectedPack] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = () => {
    if (!selectedPack) return;

    setIsPurchasing(true);

    // Simulate success
    setTimeout(() => {
      if (selectedPack.isExamSprint) {
        globalState.examMode = true;
      } else {
        globalState.credits += selectedPack.credits;
      }
      
      setIsPurchasing(false);
      
      const message = selectedPack.isExamSprint ? "Exam Sprint activated!" : "Credits added!";
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
        <Text style={styles.title}>Top up your credits.</Text>
        <Text style={styles.subtitle}>
          Running low? Get a one-time credit pack to keep generating insights without changing your plan.
        </Text>

        {PACKS.map((pack) => {
          const isSelected = selectedPack?.id === pack.id;

          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.packCard,
                isSelected && styles.packCardSelected
              ]}
              onPress={() => setSelectedPack(pack)}
              activeOpacity={0.8}
            >
              {pack.isExamSprint && (
                <View style={styles.examBadge}>
                  <Text style={styles.examText}>SPECIAL</Text>
                </View>
              )}
              <Text style={[styles.packTitle, isSelected && { color: Colors.yellow }]}>{pack.name}</Text>
              <Text style={styles.packDesc}>{pack.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.buyBtn,
            (!selectedPack || isPurchasing) && styles.buyBtnDisabled
          ]}
          onPress={handlePurchase}
          disabled={!selectedPack || isPurchasing}
        >
          <Text style={[
            styles.buyText,
            (!selectedPack || isPurchasing) && styles.buyTextDisabled
          ]}>
            {isPurchasing ? 'Processing...' : (selectedPack ? 'Buy Credits' : 'Select a pack')}
          </Text>
        </TouchableOpacity>
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
  packCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  packCardSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.05)',
  },
  examBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.coral,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  examText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  packTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  packDesc: {
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
  buyBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buyBtnDisabled: {
    backgroundColor: Colors.surfaceHigh,
  },
  buyText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  buyTextDisabled: {
    color: Colors.textMuted,
  }
});

export default CreditTopupScreen;
