import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import ProgressBar from '../components/ProgressBar';
import QuickActionButton from '../components/QuickActionButton';
import { CURRENT_TOPIC, QUICK_ACTIONS, USER } from '../data/mockData';

const { height } = Dimensions.get('window');

// Get time-based greeting
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.container}>

        {/* ── SECTION 1: HEADER ── */}
        <View style={styles.topBar}>
          <Text style={styles.appName}>sidenote</Text>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {USER.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: MAIN CONTENT ── */}
        <View style={styles.mainContent}>

          {/* Greeting block */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {USER.name}.
            </Text>
            <Text style={styles.greetingSub}>
              Pick up where you left off — or start something new
            </Text>
          </View>

          {/* Continue learning card */}
          <View style={styles.continueSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>continue learning</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>view all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.topicRow}>
              {/* Mini chart icon */}
              <View style={styles.topicIcon}>
                <Ionicons name="trending-up" size={18} color={Colors.yellow} />
              </View>

              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{CURRENT_TOPIC.title}</Text>
                <Text style={styles.topicSubtitle}>{CURRENT_TOPIC.subtitle}</Text>

                <View style={styles.progressRow}>
                  <ProgressBar progress={CURRENT_TOPIC.progress} height={5} style={styles.progressBar} />
                  <Text style={styles.progressPct}>
                    {Math.round(CURRENT_TOPIC.progress * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Flex spacer: pushes Quick Actions into lower-middle of the screen */}
        <View style={styles.midSpacer} />

        {/* ── SECTION 3: QUICK ACTIONS ── */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionLabel}>quick actions</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={() => {
                  if (action.id === 'notes') navigation.navigate('Notes');
                  else if (action.id === 'testme') navigation.navigate('Chat');
                }}
              />
            ))}
          </View>
        </View>

        {/* Bottom breathing room above tab bar */}
        <View style={styles.bottomSpacer} />

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    // No justifyContent — natural top-stack + flex spacer handles positioning
  },

  // ── HEADER ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24, // clear separation between "sidenote" and greeting
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileBtn: {},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 16,
  },

  // ── MAIN CONTENT (Greeting + Card grouped, stacks at top) ──
  mainContent: {
    gap: 32, // more breathing room between greeting and card
  },

  // Greeting
  greetingSection: {
    gap: 6,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  // Continue learning
  continueSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  viewAll: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '500',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,          // was 18 — more height inside the card
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  topicContent: {
    flex: 1,
    gap: 6,               // was 4
  },
  topicTitle: {
    color: Colors.textPrimary,
    fontSize: 17,         // was 15
    fontWeight: '600',
  },
  topicSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,         // was 12
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,        // was 8
  },
  progressBar: {
    flex: 1,
  },
  progressPct: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },

  // ── QUICK ACTIONS ──
  quickSection: {
    gap: 16,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  // Flex spacer between card and Quick Actions (flex:2 = larger share of empty space)
  midSpacer: {
    flex: 2,
  },

  // Absorbs remaining space below Quick Actions, above tab bar
  bottomSpacer: {
    flex: 1,
  },
});

export default HomeScreen;
