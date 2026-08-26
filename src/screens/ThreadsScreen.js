/**
 * ThreadsScreen.js — Learning Thread Library
 *
 * The "Chats" tab now opens this screen first.
 * It lists all learning threads (conversations) organised by:
 *   Pinned  →  Recent  →  Folders (by subject)
 *
 * Tapping a thread navigates into the existing notebook ChatScreen.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import ProgressBar from '../components/ProgressBar';
import { THREADS } from '../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Group thread list by subject for the Folders section */
const groupBySubject = (threads) => {
  const map = {};
  threads.forEach((t) => {
    if (!map[t.subject]) map[t.subject] = [];
    map[t.subject].push(t);
  });
  return map;
};

/** Subject accent colors — maps to existing note colors in mockData */
const SUBJECT_COLORS = {
  DSA:   '#E8D44D',
  DBMS:  '#56CCF2',
  OS:    '#E87D6A',
  Media: '#9B8EF2',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Single thread row */
const ThreadItem = ({ thread, onPress, showProgress = false }) => (
  <TouchableOpacity
    style={styles.threadItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {/* Left accent strip coloured by subject */}
    <View
      style={[
        styles.threadAccent,
        { backgroundColor: SUBJECT_COLORS[thread.subject] ?? Colors.yellow },
      ]}
    />

    <View style={styles.threadBody}>
      {/* Top row: title + timestamp */}
      <View style={styles.threadTopRow}>
        <Text style={styles.threadTitle} numberOfLines={1}>
          {thread.title}
        </Text>
        <Text style={styles.threadTime}>{thread.updatedAt}</Text>
      </View>

      {/* Preview */}
      <Text style={styles.threadPreview} numberOfLines={2}>
        {thread.preview}
      </Text>

      {/* Optional progress bar */}
      {showProgress && thread.progress != null && (
        <View style={styles.threadProgressRow}>
          <ProgressBar
            progress={thread.progress}
            height={3}
            style={styles.threadProgressBar}
          />
          <Text style={styles.threadProgressPct}>
            {Math.round(thread.progress * 100)}%
          </Text>
        </View>
      )}
    </View>

    {/* Right chevron */}
    <Ionicons
      name="chevron-forward"
      size={14}
      color={Colors.textMuted}
      style={styles.threadChevron}
    />
  </TouchableOpacity>
);

/** Section label with optional right action */
const SectionLabel = ({ label, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/** Folder chip — collapsible subject group header */
const FolderRow = ({ subject, count, expanded, onToggle }) => (
  <TouchableOpacity
    style={styles.folderRow}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    <View style={styles.folderLeft}>
      <View
        style={[
          styles.folderDot,
          { backgroundColor: SUBJECT_COLORS[subject] ?? Colors.yellow },
        ]}
      />
      <Text style={styles.folderLabel}>{subject}</Text>
      <View style={styles.folderCount}>
        <Text style={styles.folderCountText}>{count}</Text>
      </View>
    </View>
    <Ionicons
      name={expanded ? 'chevron-up' : 'chevron-down'}
      size={14}
      color={Colors.textMuted}
    />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const ThreadsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [query, setQuery]               = useState('');
  const [expandedFolders, setExpanded]  = useState({ DSA: true }); // DSA open by default

  // ── Derived data ────────────────────────────────────────────────────────
  const pinned  = useMemo(() => THREADS.filter((t) => t.pinned), []);
  const folders  = useMemo(() => groupBySubject(THREADS.filter((t) => !t.pinned)), []);

  // Search filters across all threads
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return THREADS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q),
    );
  }, [query]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openThread = (thread) => navigation.navigate('Chat');

  const toggleFolder = (subject) =>
    setExpanded((prev) => ({ ...prev, [subject]: !prev[subject] }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Learning Threads</Text>
          <Text style={styles.headerSub}>{THREADS.length} conversations</Text>
        </View>

        {/* New Thread button */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('Chat', { isNew: true })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#1C1C1E" />
          <Text style={styles.newBtnLabel}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={16}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="search threads…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.topDivider} />

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ── SEARCH RESULTS ── */}
        {searchResults !== null ? (
          <View style={styles.section}>
            <SectionLabel label={`Results · ${searchResults.length}`} />
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No threads match "{query}"</Text>
              </View>
            ) : (
              searchResults.map((t) => (
                <ThreadItem
                  key={t.id}
                  thread={t}
                  onPress={() => openThread(t)}
                  showProgress
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* ── PINNED ── */}
            {pinned.length > 0 && (
              <View style={styles.section}>
                <SectionLabel label="Pinned" />
                {pinned.map((t) => (
                  <ThreadItem
                    key={t.id}
                    thread={t}
                    onPress={() => openThread(t)}
                    showProgress
                  />
                ))}
              </View>
            )}

            {/* ── FOLDERS ── */}
            <View style={styles.section}>
              <SectionLabel label="Folders" />

              {Object.entries(folders).map(([subject, threads]) => (
                <View key={subject} style={styles.folderGroup}>
                  <FolderRow
                    subject={subject}
                    count={threads.length}
                    expanded={!!expandedFolders[subject]}
                    onToggle={() => toggleFolder(subject)}
                  />

                  {expandedFolders[subject] && (
                    <View style={styles.folderThreads}>
                      {threads.map((t) => (
                        <ThreadItem
                          key={t.id}
                          thread={t}
                          onPress={() => openThread(t)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.yellow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnLabel: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    padding: 0,           // override Android default
  },
  topDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 0,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    gap: 0,
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  sectionAction: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Thread item ────────────────────────────────────────────────────────────
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  threadAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  threadBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  threadTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  threadTime: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
    flexShrink: 0,
  },
  threadPreview: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400',
  },
  threadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  threadProgressBar: { flex: 1 },
  threadProgressPct: {
    color: Colors.yellow,
    fontSize: 10,
    fontWeight: '600',
    minWidth: 26,
    textAlign: 'right',
  },
  threadChevron: {
    marginRight: 12,
  },

  // ── Folder group ───────────────────────────────────────────────────────────
  folderGroup: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  folderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  folderLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  folderCount: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  folderCountText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  folderThreads: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    // Thread items inside folder get no outer margin — folder container is the card
    paddingHorizontal: 0,
  },

  // Override threadItem inside folder (no outer border radius, no bg repeat)
  // — achieved by nesting; the items just stack inside the folder card

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});

export default ThreadsScreen;
