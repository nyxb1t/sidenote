import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import {
  USER,
  PROFILE_STATS,
  LEARNING_INSIGHTS,
  USAGE_THIS_MONTH,
  CURRENT_TOPIC,
} from '../data/mockData';

const SectionTitle = ({ children, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{children}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ProfileScreen = () => {
  const creditPct = USER.creditsUsed / USER.creditsTotal;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PROFILE HEADER ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{USER.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{USER.name}</Text>
            <Text style={styles.userTagline}>keep going, you're doing great ✦</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── TAB ROW (decorative) ── */}
        <View style={styles.tabRow}>
          {['you', 'plan', 'settings'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, tab === 'plan' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'plan' && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PROGRESS OVERVIEW ── */}
        <View style={styles.section}>
          <SectionTitle>progress overview</SectionTitle>
          <View style={styles.statsRow}>
            <StatCard value={PROFILE_STATS.topicsStudied} label="topics" />
            <StatCard value={`${PROFILE_STATS.hoursThisWeek}h`} label="current streak" />
            <StatCard value={`${PROFILE_STATS.streak} days`} label="streak" />
          </View>
        </View>

        {/* ── CURRENT LEARNING ── */}
        <View style={styles.section}>
          <SectionTitle>current learning</SectionTitle>
          <View style={styles.currentLearningCard}>
            <View style={styles.currentLearningTop}>
              <View>
                <Text style={styles.currentSubject}>{CURRENT_TOPIC.subject} › {CURRENT_TOPIC.title}</Text>
                <Text style={styles.currentSubtitle}>{CURRENT_TOPIC.subtitle}</Text>
              </View>
              <Text style={styles.currentPct}>{Math.round(CURRENT_TOPIC.progress * 100)}%</Text>
            </View>
            <ProgressBar progress={CURRENT_TOPIC.progress} height={4} />
          </View>
        </View>

        {/* ── PLAN CARD ── */}
        <View style={styles.section}>
          <SectionTitle>current plan</SectionTitle>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <Text style={styles.planName}>{USER.plan}</Text>
              <TouchableOpacity style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.planDetail}>✕ 200 credits / month</Text>

            {/* Credits bar */}
            <View style={styles.creditsSection}>
              <View style={styles.creditsRow}>
                <Text style={styles.creditsLabel}>credits left</Text>
                <Text style={styles.creditsValue}>
                  {USER.creditsUsed} / {USER.creditsTotal}
                </Text>
              </View>
              <ProgressBar progress={creditPct} height={4} style={{ marginTop: 8 }} />
            </View>

            <Text style={styles.planMeta}>resets on 1 Jun 2025</Text>
          </View>
        </View>

        {/* ── LEARNING INSIGHTS ── */}
        <View style={styles.section}>
          <SectionTitle actionLabel="view all">learning insights</SectionTitle>
          {LEARNING_INSIGHTS.map((insight) => (
            <View key={insight.id} style={styles.insightRow}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>

        {/* ── USAGE THIS MONTH ── */}
        <View style={styles.section}>
          <SectionTitle>usage this month</SectionTitle>
          {USAGE_THIS_MONTH.map((item, i) => (
            <View key={i} style={styles.usageRow}>
              <Ionicons name={item.icon} size={16} color={Colors.textMuted} />
              <Text style={styles.usageLabel}>{item.label}</Text>
              <Text style={styles.usageCount}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* ── NEED MORE CREDITS ── */}
        <View style={styles.section}>
          <View style={styles.creditsNudgeCard}>
            <Text style={styles.creditsNudgeTitle}>Need more credits?</Text>
            <Text style={styles.creditsNudgeSubtext}>
              Upgrade your plan or buy add-on packs.
            </Text>
            <TouchableOpacity style={styles.nudgeBtn}>
              <Text style={styles.nudgeBtnText}>View options</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#1C1C1E',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  userTagline: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  settingsBtn: {
    padding: 4,
  },

  // Tab row
  tabRow: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.surfaceHigh,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionAction: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '500',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Current learning card
  currentLearningCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  currentLearningTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentSubject: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  currentSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  currentPct: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700',
  },

  // Plan card
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  upgradeBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  upgradeBtnText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 13,
  },
  planDetail: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  creditsSection: {
    marginTop: 4,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditsLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  creditsValue: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '600',
  },
  planMeta: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Insights
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  // Usage
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  usageLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  usageCount: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Credits nudge
  creditsNudgeCard: {
    backgroundColor: Colors.coralDim,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.coral + '40',
    gap: 8,
  },
  creditsNudgeTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  creditsNudgeSubtext: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  nudgeBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: Colors.coral,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nudgeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;
