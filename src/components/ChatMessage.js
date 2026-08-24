import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

// Renders a single chat / notebook-style message block
const ChatMessage = ({ message }) => {
  if (message.type === 'assistant') {
    return (
      <View style={styles.assistantBlock}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>g</Text>
          </View>
          <Text style={styles.senderLabel}>glint</Text>
        </View>
        <Text style={styles.assistantText}>{message.content}</Text>
      </View>
    );
  }

  if (message.type === 'note') {
    return (
      <View style={styles.noteBlock}>
        {/* Notebook highlight header */}
        <Text style={styles.noteTitle}>{message.title}</Text>

        {/* Code block */}
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>{message.code}</Text>
        </View>

        {/* Highlight row */}
        {message.highlight && (
          <View style={styles.highlightPill}>
            <Text style={styles.highlightText}>{message.highlight}</Text>
          </View>
        )}
      </View>
    );
  }

  if (message.type === 'user') {
    return (
      <View style={styles.userBlock}>
        <Text style={styles.userText}>{message.content}</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Assistant message
  assistantBlock: {
    marginBottom: 18,
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 13,
  },
  senderLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  assistantText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    paddingLeft: 34,
  },

  // Note block (notebook-style)
  noteBlock: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.yellow,
    gap: 12,
  },
  noteTitle: {
    color: Colors.yellow,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  codeBlock: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  highlightPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  highlightText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 13,
  },

  // User message
  userBlock: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ChatMessage;
