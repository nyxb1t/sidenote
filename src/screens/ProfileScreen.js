import React, { useState } from 'react';
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

// ─── Shared sub-components ───────────────────────────────────────────────────

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

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={15} color={Colors.textMuted} style={styles.infoRowIcon} />
    <Text style={styles.infoRowLabel}>{label}</Text>
    <Text style={styles.infoRowValue}>{value}</Text>
  </View>
);

// ─── You Tab ─────────────────────────────────────────────────────────────────

const YouTab = () => (
  <ScrollView
    style={styles.tabScroll}
    contentContainerStyle={styles.tabScrollContent}
    showsVerticalScrollIndicator={false}
  >
    {/* Progress Overview — topics + hours only */}
    <View style={styles.section}>
      <SectionTitle>progress overview</SectionTitle>
      <View style={styles.statsRow}>
        <StatCard value={PROFILE_STATS.topicsStudied} label="topics" />
        <StatCard value={`${PROFILE_STATS.hoursThisWeek}h`} label="hours" />
      </View>
    </View>

    {/* Current Learning */}
    <View style={styles.section}>
      <SectionTitle>current learning</SectionTitle>
      <View style={styles.currentLearningCard}>
        <View style={styles.currentLearningTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentSubject}>
              {CURRENT_TOPIC.subject} › {CURRENT_TOPIC.title}
            </Text>
            <Text style={styles.currentSubtitle}>{CURRENT_TOPIC.subtitle}</Text>
          </View>
          <Text style={styles.currentPct}>{Math.round(CURRENT_TOPIC.progress * 100)}%</Text>
        </View>
        <ProgressBar progress={CURRENT_TOPIC.progress} height={4} />
      </View>
    </View>

    {/* Learning Insights */}
    <View style={styles.section}>
      <SectionTitle actionLabel="view all">learning insights</SectionTitle>
      {LEARNING_INSIGHTS.map((insight) => (
        <View key={insight.id} style={styles.insightRow}>
          <Text style={styles.insightIcon}>{insight.icon}</Text>
          <Text style={styles.insightText}>{insight.text}</Text>
        </View>
      ))}
    </View>

    {/* Usage This Month */}
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

    {/* Account Info */}
    <View style={styles.section}>
      <SectionTitle>account info</SectionTitle>
      <View style={styles.accountCard}>
        <InfoRow icon="mail-outline" label="Email" value={USER.email} />
        <View style={styles.accountDivider} />
        <InfoRow icon="call-outline" label="Phone" value={USER.phone} />
        <View style={styles.accountDivider} />
        <InfoRow icon="calendar-outline" label="Member since" value={USER.joinDate} />
      </View>
    </View>

    <View style={{ height: 32 }} />
  </ScrollView>
);

// ─── Plan Tab ────────────────────────────────────────────────────────────────

const PlanTab = () => {
  const creditPct = USER.creditsUsed / USER.creditsTotal;

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Current Plan card */}
      <View style={styles.section}>
        <SectionTitle>current plan</SectionTitle>
        <View style={styles.planCard}>
          <View style={styles.planRow}>
            <View>
              <Text style={styles.planName}>{USER.plan}</Text>
              <Text style={styles.planDetail}>✕ 1,000 credits / month</Text>
            </View>
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          {/* Credits bar */}
          <View style={styles.creditsSection}>
            <View style={styles.creditsRow}>
              <Text style={styles.creditsLabel}>credits used</Text>
              <Text style={styles.creditsValue}>
                {USER.creditsUsed} / {USER.creditsTotal}
              </Text>
            </View>
            <ProgressBar progress={creditPct} height={5} style={{ marginTop: 8 }} />
          </View>

          <View style={styles.resetRow}>
            <Ionicons name="refresh-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.planMeta}>resets on 1 Jun 2025</Text>
          </View>
        </View>
      </View>

      {/* Need more credits nudge */}
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
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TABS = ['you', 'plan'];

const ProfileScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('you');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── PROFILE HEADER ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarInitial}>{USER.name.charAt(0)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userTagline}>keep going, you're doing great ✦</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── SEGMENTED CONTROL (you | plan) ── */}
      <View style={styles.tabRowWrapper}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'you' ? <YouTab /> : <PlanTab />}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
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

  // Segmented control
  tabRowWrapper: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
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

  // Tab scroll areas
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // Sections
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
    marginLeft: 12,
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

  // Account Info card
  accountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  infoRowIcon: {
    width: 18,
  },
  infoRowLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    width: 90,
  },
  infoRowValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  accountDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },

  // Plan card
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  upgradeBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  upgradeBtnText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 13,
  },
  planDetail: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  creditsSection: {
    gap: 0,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  planMeta: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Credits nudge card
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
