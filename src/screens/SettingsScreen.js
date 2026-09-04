import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  TextInput,
  Modal,
  Platform,
  ToastAndroid,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { globalState } from '../data/globalState';
import Colors from '../theme/colors';

// ─── Row components ───────────────────────────────────────────────────────────

const SettingsRow = ({ icon, label, value, onPress, showChevron = true }) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={17} color={Colors.textMuted} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={15} color={Colors.border} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const ToggleRow = ({ icon, label, value, onToggle }) => {
  return (
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
};

const SectionGroup = ({ title, children, actionLabel, onAction }) => {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        {actionLabel && (
          <TouchableOpacity onPress={onAction}>
            <Text style={styles.groupAction}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
};

const GroupDivider = () => {
  return <View style={styles.divider} />;
};

// ─── Settings Screen ──────────────────────────────────────────────────────────

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [preferredStyle, setPreferredStyle] = useState('visual');
  const [isEditing, setIsEditing] = useState(false);
  
  const user = globalState?.user || {
    name: "User",
    email: "example@email.com",
    phone: ""
  };

  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const learningStyles = ['visual', 'examples', 'text'];

  const handleThemeToggle = () => {
    // Theme toggle coming soon
    Alert.alert('Coming Soon', 'Theme switching will be available in a future update.');
  };

  const hasChanges = () => {
    return (
      editForm.name !== user.name ||
      editForm.email !== user.email ||
      editForm.phone !== user.phone
    );
  };

  const handleSaveClick = () => {
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }
    setShowPasswordModal(true);
    setPasswordInput('');
  };

  const handleConfirmSave = () => {
    if (!passwordInput.trim()) {
      if (Platform.OS === 'android') ToastAndroid.show('Password required', ToastAndroid.SHORT);
      else Alert.alert('Error', 'Password required');
      return;
    }
    
    // Simulate save
    setTimeout(() => {
      globalState.user = { ...editForm };
      setShowPasswordModal(false);
      setIsEditing(false);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Account updated', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Account updated');
      }
    }, 500);
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    setIsEditing(false);
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
        <SectionGroup 
          title="Account Settings" 
          actionLabel={isEditing ? "Cancel" : "Edit"} 
          onAction={isEditing ? handleCancel : () => setIsEditing(true)}
        >
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.editRow}>
                <Ionicons name="person-outline" size={17} color={Colors.textMuted} style={styles.rowIcon} />
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={v => setEditForm({...editForm, name: v})}
                  placeholder="Name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.editRow}>
                <Ionicons name="mail-outline" size={17} color={Colors.textMuted} style={styles.rowIcon} />
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={v => setEditForm({...editForm, email: v})}
                  placeholder="Email"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.editRow}>
                <Ionicons name="call-outline" size={17} color={Colors.textMuted} style={styles.rowIcon} />
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={v => setEditForm({...editForm, phone: v})}
                  placeholder="Phone"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity 
                style={[styles.saveBtn, !hasChanges() && styles.saveBtnDisabled]} 
                onPress={handleSaveClick}
                disabled={!hasChanges()}
              >
                <Text style={[styles.saveBtnText, !hasChanges() && styles.saveBtnTextDisabled]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SettingsRow
                icon="person-outline"
                label="Name"
                value={user.name}
                showChevron={false}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="mail-outline"
                label="Email"
                value={user.email}
                showChevron={false}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="call-outline"
                label="Phone"
                value={user.phone}
                showChevron={false}
              />
            </>
          )}
          {!isEditing && (
            <>
              <View style={styles.divider} />
              <SettingsRow
                icon="lock-closed-outline"
                label="Change password"
                onPress={() => {}}
              />
            </>
          )}
        </SectionGroup>

        {/* ── App Preferences ── */}
        <SectionGroup title="App Preferences">
          <ToggleRow
            icon="contrast-outline"
            label="Dark Theme"
            value={true}
            onToggle={handleThemeToggle}
          />
          <View style={styles.divider} />
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
          <View style={styles.divider} />
          <SettingsRow
            icon="close-circle-outline"
            label="Clear app memory"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="download-outline"
            label="Export notes"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="refresh-outline"
            label="Reset onboarding preferences"
            onPress={() => navigation.navigate('OnboardingScreen')}
          />
        </SectionGroup>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={() => navigation.replace('AuthChoiceScreen')}>
          <Ionicons name="log-out-outline" size={18} color={Colors.coral} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Changes</Text>
            <Text style={styles.modalSubtitle}>Enter password to confirm</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmSave}>
                <Text style={styles.modalBtnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: Colors.textPrimary,
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textPrimary,
  },
  groupAction: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.yellow,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
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
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 13,
    color: Colors.textPrimary,
  },

  // Edit form
  editForm: {
    padding: 16,
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceHigh,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '600',
  },
  saveBtnTextDisabled: {
    color: Colors.textSecondary,
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
    borderColor: Colors.coralDim,
    marginBottom: 8,
  },
  logoutText: {
    color: Colors.coral,
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: Colors.textPrimary,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalBtnCancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.yellow,
    borderRadius: 8,
  },
  modalBtnConfirmText: {
    color: '#000',
    fontWeight: '600',
  },
});

export default SettingsScreen;
