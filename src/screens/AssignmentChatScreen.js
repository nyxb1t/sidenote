import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

export default function AssignmentChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: 'I received your assignment. Let\'s solve this concept-by-concept. First, what do you think is the core principle here?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages([...messages, newMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: 'Good! Now let\'s break down the next step...' }]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment Guide</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.chatContainer}>
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgBubble, msg.role === 'user' ? styles.msgUser : styles.msgAi]}>
              <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  chatContainer: { padding: 20, gap: 16 },
  msgBubble: { padding: 16, borderRadius: 16, maxWidth: '85%' },
  msgUser: { backgroundColor: Colors.yellow, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgAi: { backgroundColor: Colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  msgText: { color: Colors.textPrimary, fontSize: 16, lineHeight: 22 },
  msgTextUser: { color: '#1C1C1E' },
  inputArea: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, color: Colors.textPrimary, fontSize: 16, minHeight: 48, maxHeight: 120 },
  sendBtn: { marginLeft: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
