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

// ── Tag pill (same colour map as TopicNotesScreen) ────────────────────────────
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

// ── Lightweight markdown-ish renderer ─────────────────────────────────────────
// Handles **bold** headings and plain paragraphs.
const BodyRenderer = ({ body }) => {
  if (!body) return null;

  const lines = body.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<View key={key++} style={styles.paraGap} />);
      continue;
    }

    // Bold heading: line starts AND ends with ** (e.g. "**Title:**")
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <Text key={key++} style={styles.heading}>
          {line.replace(/\*\*/g, '')}
        </Text>
      );
      continue;
    }

    // Mixed bold inline: split on **...**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      elements.push(
        <Text key={key++} style={styles.bodyText}>
          {parts.map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text key={pi} style={styles.bold}>
                  {part.replace(/\*\*/g, '')}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      elements.push(
        <View key={key++} style={styles.listRow}>
          <Text style={styles.bullet}>·</Text>
          <Text style={[styles.bodyText, styles.listText]}>{line.slice(2)}</Text>
        </View>
      );
      continue;
    }

    // Numbered item
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <View key={key++} style={styles.listRow}>
          <Text style={styles.bullet}>{num}.</Text>
          <Text style={[styles.bodyText, styles.listText]}>{line.replace(/^\d+\. /, '')}</Text>
        </View>
      );
      continue;
    }

    // Plain line
    elements.push(
      <Text key={key++} style={styles.bodyText}>{line}</Text>
    );
  }

  return <>{elements}</>;
};

// ── Screen ────────────────────────────────────────────────────────────────────
const NoteDetailScreen = ({ route, navigation }) => {
  const { note, topic } = route.params;

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

        <Text style={styles.headerBreadcrumb} numberOfLines={1}>
          {topic.title}
        </Text>

        {/* Phantom element to keep breadcrumb centred */}
        <View style={styles.backBtn} />
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic pill */}
        <View style={styles.topRow}>
          <TagPill tag={note.tag} />
          <Text style={styles.timestamp}>{note.updatedAt}</Text>
        </View>

        {/* Note title */}
        <Text style={styles.title}>{note.title}</Text>

        {/* Thin accent rule */}
        <View
          style={[
            styles.accentRule,
            {
              backgroundColor:
                (TAG_COLORS[note.tag] || TAG_COLORS.Concept).text + '55',
            },
          ]}
        />

        {/* Body */}
        <View style={styles.body}>
          <BodyRenderer body={note.body} />
        </View>

        <View style={{ height: 40 }} />
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
  headerBreadcrumb: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  // Meta
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Title
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Accent rule
  accentRule: {
    height: 2,
    borderRadius: 2,
    width: 40,
    marginBottom: 20,
  },

  // Body text
  body: {
    gap: 0,
  },
  bodyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 4,
  },
  paraGap: {
    height: 10,
  },
  listRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    minWidth: 16,
  },
  listText: {
    flex: 1,
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
});

export default NoteDetailScreen;
