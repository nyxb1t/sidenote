import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { USER } from '../data/mockData';

// ─── Row components ───────────────────────────────────────────────────────────

const SettingsRow = ({ icon, label, value, onPress, showChevron = true }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={17} color={Colors.textMuted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {showChevron && (
        <Ionicons name="chevron-forward" size={15} color={Colors.border} />
      )}
    </View>
  </TouchableOpacity>
);

const ToggleRow = ({ icon, label, value, onToggle }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={17} color={Colors.textMuted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: Colors.border, true: Colors.yellow + '80' }}
      thumbColor={value ? Colors.yellow : Colors.textMuted}
      ios_backgroundColor={Colors.border}
    />
  </View>
);

const SectionGroup = ({ title, children }) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.groupCard}>{children}</View>
  </View>
);

const GroupDivider = () => <View style={styles.divider} />;

// ─── Settings Screen ──────────────────────────────────────────────────────────

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [preferredStyle, setPreferredStyle] = useState('visual');

  const learningStyles = ['visual', 'examples', 'text'];

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
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Account Settings ── */}
        <SectionGroup title="Account">
          <SettingsRow
            icon="mail-outline"
            label="Email"
            value={USER.email}
            showChevron={false}
          />
          <GroupDivider />
          <SettingsRow
            icon="call-outline"
            label="Phone"
            value={USER.phone}
            showChevron={false}
          />
          <GroupDivider />
          <SettingsRow
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => {}}
          />
        </SectionGroup>

        {/* ── App Preferences ── */}
        <SectionGroup title="App Preferences">
          <SettingsRow
            icon="contrast-outline"
            label="Theme"
            value="Dark"
            onPress={() => {}}
          />
          <GroupDivider />
          <ToggleRow
            icon="notifications-outline"
            label="Notifications"
            value={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
        </SectionGroup>

        {/* ── Learning Preferences ── */}
        <SectionGroup title="Learning Preferences">
          <View style={styles.stylePickerWrapper}>
            <View style={styles.stylePickerHeader}>
              <Ionicons name="book-outline" size={17} color={Colors.textMuted} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Preferred style</Text>
            </View>
            <View style={styles.stylePicker}>
              {learningStyles.map((style) => {
                const isActive = style === preferredStyle;
                return (
                  <TouchableOpacity
                    key={style}
                    style={[styles.stylePill, isActive && styles.stylePillActive]}
                    onPress={() => setPreferredStyle(style)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stylePillText, isActive && styles.stylePillTextActive]}>
                      {style}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SectionGroup>

        {/* ── Data & Privacy ── */}
        <SectionGroup title="Data & Privacy">
          <SettingsRow
            icon="trash-outline"
            label="Clear chat history"
            onPress={() => {}}
          />
          <GroupDivider />
          <SettingsRow
            icon="download-outline"
            label="Export notes"
            onPress={() => {}}
          />
        </SectionGroup>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={Colors.coral} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 28,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Section groups
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
    width: 18,
  },
  rowLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  // Learning style picker
  stylePickerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  stylePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stylePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  stylePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stylePillActive: {
    backgroundColor: Colors.yellowDim,
    borderColor: Colors.yellow,
  },
  stylePillText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  stylePillTextActive: {
    color: Colors.yellow,
    fontWeight: '600',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.coralDim,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.coral + '30',
    marginBottom: 8,
  },
  logoutText: {
    color: Colors.coral,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SettingsScreen;
