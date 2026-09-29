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
import { TOPIC_NOTES } from '../data/mockData';
import Colors from '../theme/colors';

// ── Tag pill ──────────────────────────────────────────────────────────────────
const TAG_COLORS = {
  Concept: { bg: '#E8D44D22', text: '#E8D44D', border: '#E8D44D44' },
  Visual:  { bg: '#56CCF222', text: '#56CCF2', border: '#56CCF244' },
  Insight: { bg: '#9B8EF222', text: '#9B8EF2', border: '#9B8EF244' },
};

const TagPill = ({ tag }) => {
  const c = TAG_COLORS[tag] || TAG_COLORS.Concept;
  return (
    <View style={[styles.tag, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.tagText, { color: c.text }]}>{tag}</Text>
    </View>
  );
};

// ── Individual note row card ──────────────────────────────────────────────────
const NoteItem = ({ note, onPress }) => {
  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.noteCardInner}>
        <View style={styles.noteTop}>
          <TagPill tag={note.tag} />
          <Text style={styles.noteTimestamp}>{note.updatedAt}</Text>
        </View>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>{note.preview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const TopicNotesScreen = ({ route, navigation }) => {
  const { topic } = route.params;           // topic = one NOTES entry
  const notes = TOPIC_NOTES[topic.id] || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSubject}>{topic.subject}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{topic.title}</Text>
        </View>

        {/* Spacer to balance the back button */}
        <View style={styles.backBtn} />
      </View>

      {/* ── META ── */}
      <View style={styles.meta}>
        <View style={[styles.metaDot, { backgroundColor: topic.color + '40' }]}>
          <View style={[styles.metaDotInner, { backgroundColor: topic.color }]} />
        </View>
        <Text style={styles.metaCount}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'} collected
        </Text>
      </View>

      {/* ── DIVIDER ── */}
      <View style={styles.divider} />

      {/* ── NOTE LIST ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>
              Notes appear here as you learn this topic in a session.
            </Text>
          </View>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onPress={() => navigation.navigate('NoteDetailScreen', { note, topic })}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerSubject: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Meta bar
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 10,
  },
  metaDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaCount: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
    marginBottom: 16,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },

  // Note card
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  noteCardInner: {
    flex: 1,
    gap: 5,
  },
  noteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  notePreview: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noteTimestamp: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Tag pill
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});

export default TopicNotesScreen;
