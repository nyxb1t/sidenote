import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

const NoteCard = ({ note, onPress }) => {
  const initials = note.subject.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Left color dot / subject tag */}
      <View style={[styles.subjectDot, { backgroundColor: note.color + '30' }]}>
        <View style={[styles.dotInner, { backgroundColor: note.color }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.subjectTag}>{note.subject}</Text>
          <Text style={styles.timestamp}>{note.updatedAt}</Text>
        </View>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.preview} numberOfLines={1}>{note.preview}</Text>
        <Text style={styles.noteCount}>{note.noteCount} notes</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  subjectDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectTag: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  preview: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noteCount: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});

export default NoteCard;
