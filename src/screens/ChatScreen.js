import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import ChatMessage from '../components/ChatMessage';
import { CHAT_MESSAGES, CURRENT_TOPIC } from '../data/mockData';

const ACTION_BUTTONS = [
  { id: 'visual', label: 'Explain visually', icon: 'eye-outline' },
  { id: 'example', label: 'Give example', icon: 'bulb-outline' },
  { id: 'test', label: 'Test me', icon: 'flash-outline' },
  { id: 'retry', label: 'Try again', icon: 'refresh-outline' },
];

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Mock reply
    const reply = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Got it — let me break that down for you.\n\n"${text}" is a great question. Here's how I'd approach it...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg, reply]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleAction = (actionId) => {
    const actionMap = {
      visual: 'Explain this visually.',
      example: 'Give me a concrete example.',
      test: 'Test me on this topic.',
      retry: 'Let me try again from the start.',
    };
    const text = actionMap[actionId] || '';
    const newMsg = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const reply = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Sure! Let me walk you through that...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg, reply]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── FIXED HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{CURRENT_TOPIC.title}</Text>
          <Text style={styles.headerSubtitle}>
            {CURRENT_TOPIC.subject} · Memoisation
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="bookmark-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Thin separator */}
      <View style={styles.separator} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── SCROLLABLE CONTENT ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Notebook-style topic header */}
          <View style={styles.notebookHeader}>
            <Text style={styles.notebookSubject}>{CURRENT_TOPIC.subject} › {CURRENT_TOPIC.title}</Text>
            <View style={styles.notebookLine} />
          </View>

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Action buttons after content */}
          <View style={styles.actionGrid}>
            {ACTION_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.id}
                style={styles.actionBtn}
                onPress={() => handleAction(btn.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={btn.icon} size={15} color={Colors.yellow} />
                <Text style={styles.actionBtnText}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ── FIXED INPUT BAR ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="ask a follow-up..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : null,
            ]}
            onPress={sendMessage}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={inputText.trim() ? '#1C1C1E' : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },

  // Scroll area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Notebook header
  notebookHeader: {
    marginBottom: 24,
    gap: 8,
  },
  notebookSubject: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notebookLine: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // Action buttons grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
    backgroundColor: Colors.bg,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtnActive: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.yellow,
  },
});

export default ChatScreen;
