/**
 * ChatScreen.js  →  Notebook Learning Screen
 *
 * Refactored from a chat UI into a notebook-style learning interface.
 * No FlatList, no chat bubbles, no sender labels.
 * Content flows as sequential notebook blocks inside a ScrollView.
 */

import React, { useRef, useState, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { CURRENT_TOPIC, NOTEBOOK_CONTENT } from '../data/mockData';

// ─── Action panel items ────────────────────────────────────────────────────────
const PANEL_ACTIONS = [
  { id: 'visual',   icon: 'eye-outline',           label: 'Visual\nexplanation' },
  { id: 'examples', icon: 'book-outline',           label: 'More\nexamples'    },
  { id: 'practice', icon: 'barbell-outline',        label: 'Practice\nquestions' },
  { id: 'retry',    icon: 'refresh-outline',        label: 'Try\nagain'        },
  { id: 'note',     icon: 'create-outline',         label: 'Sticky\nnote'      },
];

// ─── Panel heights ─────────────────────────────────────────────────────────────
const PANEL_COLLAPSED_H = 54;
const PANEL_EXPANDED_H  = 130;

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ChatScreen = ({ navigation, route }) => {
  const isNew = route?.params?.isNew ?? false;
  const insets           = useSafeAreaInsets();
  const scrollRef        = useRef(null);
  const [inputText, setInputText]   = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [panelOpen, setPanelOpen]   = useState(false);
  const [userNotes, setUserNotes]   = useState([]);

  // Animated value for panel height
  const panelAnim = useRef(new Animated.Value(PANEL_COLLAPSED_H)).current;

  // ── Toggle panel ──────────────────────────────────────────────────────────
  const togglePanel = useCallback(() => {
    const toValue = panelOpen ? PANEL_COLLAPSED_H : PANEL_EXPANDED_H;
    setPanelOpen(!panelOpen);
    Animated.spring(panelAnim, {
      toValue,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [panelOpen, panelAnim]);

  const collapsePanel = useCallback(() => {
    if (!panelOpen) return;
    setPanelOpen(false);
    Animated.spring(panelAnim, {
      toValue: PANEL_COLLAPSED_H,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [panelOpen, panelAnim]);

  // ── Handle panel action ──────────────────────────────────────────────────
  const handlePanelAction = (id) => {
    collapsePanel();
    // extend with real logic per action
  };

  // ── Inline content actions ────────────────────────────────────────────────
  const handleInlineAction = (label) => {
    // placeholder — wire up to your AI/content layer
  };

  // ── Send note / question ─────────────────────────────────────────────────
  const sendNote = () => {
    const text = inputText.trim();
    if (!text) return;
    setUserNotes((prev) => [...prev, { id: Date.now().toString(), text }]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  // ── Opacity interpolation for labels (collapsed → expanded) ──────────────
  const labelOpacity = panelAnim.interpolate({
    inputRange: [PANEL_COLLAPSED_H, PANEL_EXPANDED_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const iconMarginBottom = panelAnim.interpolate({
    inputRange: [PANEL_COLLAPSED_H, PANEL_EXPANDED_H],
    outputRange: [0, 6],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{CURRENT_TOPIC.title}</Text>
          <Text style={styles.headerSubtitle}>
            {CURRENT_TOPIC.subject} · Memoisation
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setBookmarked((b) => !b)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? Colors.yellow : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Subtle divider */}
      <View style={styles.dividerTop} />

      {/* ── KEYBOARD AVOIDING WRAPPER ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={0}
      >
        {/* ── SCROLLABLE NOTEBOOK CONTENT ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + PANEL_EXPANDED_H + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={collapsePanel}
          scrollEventThrottle={16}
        >
          {/* ─── Empty state for new thread ─── */}
          {isNew ? (
            <View style={styles.emptyThread}>
              <Text style={styles.emptyThreadIcon}>✦</Text>
              <Text style={styles.emptyThreadTitle}>New learning thread</Text>
              <Text style={styles.emptyThreadHint}>
                Ask a question, paste a topic, or just start writing.
              </Text>
            </View>
          ) : (
            /* ─── Existing thread: render notebook blocks ─── */
            NOTEBOOK_CONTENT.map((block) => (
              <NotebookBlock
                key={block.id}
                block={block}
                onInlineAction={handleInlineAction}
              />
            ))
          )}

          {/* ─── User-appended notes ─── */}
          {userNotes.map((note) => (
            <View key={note.id} style={styles.userNote}>
              <Text style={styles.userNoteText}>{note.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── FIXED BOTTOM ── */}
        <View
          style={[
            styles.bottomFixed,
            { paddingBottom: insets.bottom },
          ]}
        >
          {/* ── ACTION PANEL ── */}
          <Animated.View style={[styles.actionPanel, { height: panelAnim }]}>
            {/* Collapsed strip — always tappable */}
            <TouchableOpacity
              style={styles.panelStrip}
              onPress={togglePanel}
              activeOpacity={0.85}
            >
              {PANEL_ACTIONS.map((action) => (
                <Animated.View
                  key={action.id}
                  style={[styles.panelItem, { marginBottom: iconMarginBottom }]}
                >
                  <TouchableOpacity
                    onPress={() => panelOpen && handlePanelAction(action.id)}
                    onLongPress={() => handlePanelAction(action.id)}
                    activeOpacity={0.65}
                    style={styles.panelItemInner}
                  >
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Animated.Text
                      style={[styles.panelItemLabel, { opacity: labelOpacity }]}
                      numberOfLines={2}
                    >
                      {action.label}
                    </Animated.Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </TouchableOpacity>
          </Animated.View>

          {/* ── INPUT BAR ── */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="ask or write your thoughts…"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendNote}
              onFocus={collapsePanel}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                inputText.trim() ? styles.sendBtnActive : null,
              ]}
              onPress={sendNote}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={inputText.trim() ? '#1C1C1E' : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NotebookBlock — renders one content block based on its `type`
// ─────────────────────────────────────────────────────────────────────────────
const NotebookBlock = ({ block, onInlineAction }) => {
  const [revealed, setRevealed] = useState(false);

  switch (block.type) {

    // ── Plain explanation paragraph ───────────────────────────────────────
    case 'paragraph':
      return (
        <View style={nb.block}>
          <Text style={nb.para}>
            {block.segments
              ? block.segments.map((seg, i) =>
                  seg.highlight ? (
                    <Text key={i} style={nb.highlight}>{seg.text}</Text>
                  ) : seg.underline ? (
                    <Text key={i} style={nb.underline}>{seg.text}</Text>
                  ) : (
                    <Text key={i}>{seg.text}</Text>
                  )
                )
              : block.text}
          </Text>
        </View>
      );

    // ── Inline code block ─────────────────────────────────────────────────
    case 'code':
      return (
        <View style={nb.block}>
          <View style={nb.codeWrap}>
            <Text style={nb.codeText}>{block.code}</Text>
          </View>
        </View>
      );

    // ── Array diagram (index / value / dp rows) ───────────────────────────
    case 'diagram':
      return (
        <View style={nb.block}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            scrollEventThrottle={16}
          >
            <View>
              {/* Index labels */}
              <View style={nb.diagRow}>
                {block.indices.map((idx) => (
                  <Text key={idx} style={nb.diagIdx}>{idx}</Text>
                ))}
              </View>

              {/* Value cells */}
              <View style={nb.diagRow}>
                {block.values.map((val, i) => (
                  <View
                    key={i}
                    style={[
                      nb.diagCell,
                      block.highlighted?.includes(i) && nb.diagCellHi,
                    ]}
                  >
                    <Text
                      style={[
                        nb.diagCellText,
                        block.highlighted?.includes(i) && nb.diagCellTextHi,
                      ]}
                    >
                      {val}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Arrow row */}
              <View style={nb.diagRow}>
                {block.values.map((_, i) => (
                  <Text key={i} style={nb.diagArrow}>↓</Text>
                ))}
              </View>

              {/* DP values */}
              {block.dp && (
                <View style={nb.diagRow}>
                  {block.dp.map((v, i) => (
                    <Text
                      key={i}
                      style={[
                        nb.diagDp,
                        block.dpHighlighted?.includes(i) && nb.diagDpHi,
                      ]}
                    >
                      {v}
                    </Text>
                  ))}
                </View>
              )}

              {/* Annotation */}
              {block.annotation && (
                <View style={nb.diagAnnotation}>
                  <Text style={nb.diagAnnotationArrow}>←</Text>
                  <Text style={nb.diagAnnotationText}>{block.annotation}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      );

    // ── Result / conclusion line ──────────────────────────────────────────
    case 'result':
      return (
        <View style={nb.block}>
          <Text style={nb.para}>
            {block.text}{' '}
            {block.resultCode && (
              <Text style={nb.resultCode}>{block.resultCode}</Text>
            )}
          </Text>
        </View>
      );

    // ── Thin section divider ──────────────────────────────────────────────
    case 'divider':
      return <View style={nb.divider} />;

    // ── Inline action links ───────────────────────────────────────────────
    case 'actions':
      return (
        <View style={nb.inlineActions}>
          {block.items.map((item) => (
            <TouchableOpacity
              key={item}
              style={nb.inlineAction}
              onPress={() => onInlineAction(item)}
              activeOpacity={0.6}
            >
              <Text style={nb.inlineActionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );

    // ── Think / reveal block ──────────────────────────────────────────────
    case 'think':
      return (
        <View style={nb.block}>
          <Text style={nb.thinkQuestion}>{block.question}</Text>
          <Text style={nb.thinkHint}>{block.hint}</Text>

          <TouchableOpacity
            onPress={() => setRevealed((r) => !r)}
            style={nb.thinkRevealBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={revealed ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={revealed ? Colors.yellow : Colors.textMuted}
            />
          </TouchableOpacity>

          {revealed && (
            <View style={nb.thinkAnswer}>
              <Text style={nb.thinkAnswerText}>{block.answer}</Text>
            </View>
          )}
        </View>
      );

    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Notebook block styles
// ─────────────────────────────────────────────────────────────────────────────
const nb = StyleSheet.create({
  block: {
    marginBottom: 20,
  },

  // Paragraph
  para: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  highlight: {
    color: Colors.yellow,
    fontWeight: '500',
  },
  underline: {
    color: Colors.textPrimary,
    textDecorationLine: 'underline',
    textDecorationColor: Colors.textSecondary,
  },

  // Code
  codeWrap: {
    backgroundColor: '#14141C',
    borderWidth: 1,
    borderColor: '#252535',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  codeText: {
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13.5,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // Diagram
  diagRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  diagIdx: {
    width: 38,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  diagCell: {
    width: 38,
    height: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  diagCellHi: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.09)',
  },
  diagCellText: {
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  diagCellTextHi: {
    color: Colors.yellow,
  },
  diagArrow: {
    width: 40,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
  },
  diagDp: {
    width: 40,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  diagDpHi: { color: Colors.yellow },
  diagAnnotation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  diagAnnotationArrow: { color: Colors.textMuted, fontSize: 13 },
  diagAnnotationText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Result
  resultCode: {
    color: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.1)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 22,
  },

  // Inline actions
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  inlineAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inlineActionText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  // Think block
  thinkQuestion: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  thinkHint: {
    color: Colors.textMuted,
    fontSize: 13.5,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  thinkRevealBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  thinkAnswer: {
    marginTop: 10,
    paddingLeft: 14,
    paddingVertical: 12,
    paddingRight: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.04)',
    borderRadius: 4,
  },
  thinkAnswerText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },
  dividerTop: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // ── Empty new-thread state ────────────────────────────────────────────────
  emptyThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyThreadIcon: {
    fontSize: 28,
    color: Colors.yellow,
    marginBottom: 4,
  },
  emptyThreadTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptyThreadHint: {
    color: Colors.textMuted,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  // ── User note (appended from input) ──────────────────────────────────────
  userNote: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(232,212,77,0.3)',
    backgroundColor: 'rgba(232,212,77,0.04)',
    borderRadius: 4,
    paddingLeft: 14,
    paddingVertical: 11,
    paddingRight: 12,
    marginBottom: 18,
  },
  userNoteText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Fixed bottom container ────────────────────────────────────────────────
  // Normal flex child (not absolute) so KeyboardAvoidingView can push it up
  // when the keyboard opens. Scroll works fine — the Pressable removal + 
  // nestedScrollEnabled are what fixed that, not the absolute positioning.
  bottomFixed: {
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },

  // ── Action panel ─────────────────────────────────────────────────────────
  actionPanel: {
    overflow: 'hidden',
    backgroundColor: 'rgba(30,30,32,0.95)',
  },
  panelStrip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  panelItem: {
    flex: 1,
    alignItems: 'center',
  },
  panelItemInner: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  panelItemLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // ── Input bar ────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtnActive: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.yellow,
  },
});

export default ChatScreen;
