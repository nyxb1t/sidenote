import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  globalState,
  getMostRecentChatForTopic,
  createChatForTopic,
  saveChatNote,
  saveStickyNotes,
  getStickyNotes,
  setChatSessionBookmarked
} from '../data/globalState';

import {
  generateNotes,
  generateRetryExplanation,
  trackLearnerEvent,
  updateLessonProgress
} from '../services/aiService';

import DraggableStickyNote from '../components/DraggableStickyNote';
import StickyNoteToolbar from '../components/StickyNoteToolbar';
import Colors from '../theme/colors';


// ─── Action panel items ────────────────────────────────────────────────────────
const PANEL_ACTIONS = [
  { id: 'visual',   icon: 'eye-outline',           label: 'Visual\nexplanation' },
  { id: 'examples', icon: 'book-outline',           label: 'More\nexamples'    },
  { id: 'practice', icon: 'barbell-outline',        label: 'Practice\nquestions' },
  { id: 'retry',    icon: 'refresh-outline',        label: 'Try\nagain'        },
  { id: 'notes',    icon: 'document-text-outline',  label: 'Generate\nNotes'   },
];

// ─── Panel heights ─────────────────────────────────────────────────────────────
const PANEL_COLLAPSED_H = 54;
const PANEL_EXPANDED_H  = 130;

// ─── Practice MCQ data ─────────────────────────────────────────────────────────
// Each question: { question, options: [{key, label}], correctKey, explanations: {key} }
const PRACTICE_QUESTIONS = [
  {
    question: 'What is the time complexity of LIS using patience sorting?',
    options: [
      { key: 'A', label: 'O(n²)' },
      { key: 'B', label: 'O(n log n)' },
      { key: 'C', label: 'O(2ⁿ)' },
      { key: 'D', label: 'O(n)' },
    ],
    correctKey: 'B',
    explanations: {
      A: 'O(n²) applies to the naive DP approach — checking every previous element for each position. Patience sorting does better.',
      B: 'Correct! Patience sorting uses binary search on "piles", so each of the n elements takes O(log n) → total O(n log n).',
      C: 'O(2ⁿ) would be brute-force enumeration of all subsequences — extremely slow and not how LIS is solved.',
      D: 'O(n) is not achievable for LIS in the general case. Even reading the input is O(n), but finding the LIS requires O(n log n).',
    },
  },
  {
    question: 'Which data structure is best for implementing a priority queue?',
    options: [
      { key: 'A', label: 'Array' },
      { key: 'B', label: 'Linked List' },
      { key: 'C', label: 'Heap' },
      { key: 'D', label: 'Stack' },
    ],
    correctKey: 'C',
    explanations: {
      A: 'An array gives O(n) for insertion or extraction of the min/max. A heap is much more efficient.',
      B: 'A sorted linked list gives O(n) insertion and O(1) extraction — still not optimal.',
      C: 'Correct! A heap gives O(log n) insertion and O(log n) extraction, making it the standard choice for priority queues.',
      D: 'A stack is LIFO — it has no concept of priority. It cannot serve as a priority queue.',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ChatScreen = ({ navigation, route }) => {
  const { chatId, topicId, topicTitle, isNewChat, isNew: routeIsNew } = route?.params || {};

  // ── Resolve or create chat session ──────────────────────────────────────
  // Rules (strict, no fallback auto-creation or navigation):
  //   IF chatId        → load that exact session
  //   ELSE IF isNewChat/isNew → create a new session for the topic
  //   ELSE IF topicId/topicTitle → load most recent session for the topic
  //   ELSE             → no session (empty state, user must go back to Threads)
  const [chatSession, setChatSession] = useState(() => {
    if (chatId) {
      const exact = globalState.chatSessions.find(c => c.id === chatId);
      if (exact) return exact;
    }
    if (routeIsNew || isNewChat) {
      return createChatForTopic({ topicId, topicTitle });
    }
    if (topicId || topicTitle) {
      const existing = getMostRecentChatForTopic(topicId, topicTitle);
      if (existing) return existing;
      return createChatForTopic({ topicId, topicTitle });
    }
    // No params — show empty state, do NOT navigate away automatically
    return null;
  });

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [bookmarked, setBookmarked] = useState(chatSession?.bookmarked || false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // ── Sticky notes state ───────────────────────────────────────────────────
  const [stickyNotes, setStickyNotes] = useState(() =>
    getStickyNotes(chatSession?.id)
  );
  // Which note is currently selected (shows toolbar, auto-focuses TextInput)
  const [activeNoteId, setActiveNoteId] = useState(null);
  // True while dragging OR resizing a note → disables ScrollView scroll
  const [isDraggingNote, setIsDraggingNote] = useState(false);


  // ── Unified message list — single source of truth for all chat content ───
  // Every message has: { id, type, timestamp, ...typeSpecificFields }
  // type: 'block' | 'userNote' | 'visual' | 'practice'
  const [messages, setMessages] = useState(() => {
    const initialBlocks = chatSession?.blocks || [];
    const initialNotes = chatSession?.userNotes || [];
    // Convert existing session data to unified message format,
    // preserving their original order (blocks first, then notes)
    const blockMessages = initialBlocks.map((block, i) => ({
      id: block.id || ('init-block-' + i),
      type: 'block',
      timestamp: i, // ordinal for initial load; real actions use Date.now()
      block,
    }));
    const noteMessages = initialNotes.map((note, i) => ({
      id: note.id || ('init-note-' + i),
      type: 'userNote',
      timestamp: initialBlocks.length + i,
      text: note.text,
    }));
    return [...blockMessages, ...noteMessages];
  });

  // ── Re-sync session when route params change (e.g. navigating to a new chat)
  // This effect only runs when params actually change — it does NOT auto-redirect.
  useEffect(() => {
    // Skip if no params were passed at all
    if (!chatId && !topicId && !topicTitle && !isNewChat && !routeIsNew) return;

    let session;
    if (chatId) {
      session = globalState.chatSessions.find(c => c.id === chatId);
    }
    if (!session && (topicId || topicTitle)) {
      if (routeIsNew || isNewChat) {
        session = createChatForTopic({ topicId, topicTitle });
      } else {
        session = getMostRecentChatForTopic(topicId, topicTitle);
        if (!session) session = createChatForTopic({ topicId, topicTitle });
      }
    }
    if (session) {
      setChatSession(session);
      setBookmarked(session.bookmarked || false);
      // Re-seed unified messages from session (order: blocks → notes)
      const sessionBlocks = session.blocks || [];
      const sessionNotes = session.userNotes || [];
      const blockMsgs = sessionBlocks.map((block, i) => ({
        id: block.id || ('init-block-' + i),
        type: 'block',
        timestamp: i,
        block,
      }));
      const noteMsgs = sessionNotes.map((note, i) => ({
        id: note.id || ('init-note-' + i),
        type: 'userNote',
        timestamp: sessionBlocks.length + i,
        text: note.text,
      }));
      setMessages([...blockMsgs, ...noteMsgs]);
    }
  }, [chatId, topicId, topicTitle, isNewChat, routeIsNew]);

  // ── Reload sticky notes when session changes (e.g. navigating to new chat)
  useEffect(() => {
    if (chatSession?.id) {
      setStickyNotes(getStickyNotes(chatSession.id));
      setActiveNoteId(null);
    }
  }, [chatSession?.id]);

  // ── Sticky note CRUD helpers ──────────────────────────────────────────────

  /**
   * Creates a new note positioned near the top of the note layer,
   * staggered so multiple notes don't perfectly overlap.
   */
  const addStickyNote = useCallback(() => {
    const stagger = (stickyNotes.length % 4) * 18;
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      offsetX: 20 + stagger,
      offsetY: 20 + stagger,
      width: 165,
      height: 165,
      text: '',
      color: '#FDEE87',
      strokes: [],
      mode: 'text',
      penColor: '#1a1a1a',
      penThickness: 2,
    };
    setStickyNotes((prev) => {
      const next = [...prev, newNote];
      if (chatSession?.id) saveStickyNotes(chatSession.id, next);
      return next;
    });
    // Auto-activate new note so TextInput gets focus immediately
    setActiveNoteId(newNote.id);
  }, [stickyNotes.length, chatSession?.id]);

  /**
   * Merges a partial patch into the note with the given id,
   * then persists the entire updated array.
   */
  const updateStickyNote = useCallback((noteId, patch) => {
    setStickyNotes((prev) => {
      const next = prev.map((n) =>
        n.id === noteId ? { ...n, ...patch } : n
      );
      if (chatSession?.id) saveStickyNotes(chatSession.id, next);
      return next;
    });
  }, [chatSession?.id]);

  /**
   * Removes a note by id, deactivates toolbar if it was active.
   */
  const removeStickyNote = useCallback((noteId) => {
    setStickyNotes((prev) => {
      const next = prev.filter((n) => n.id !== noteId);
      if (chatSession?.id) saveStickyNotes(chatSession.id, next);
      return next;
    });
    setActiveNoteId((prev) => (prev === noteId ? null : prev));
  }, [chatSession?.id]);

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

  // ── Handle panel action — APPEND-ONLY to messages ────────────────────────
  const handlePanelAction = (id) => {
    collapsePanel();
if (id === 'note') {
  addStickyNote();

} else if (id === 'notes') {
  if (isGeneratingNotes) return;
  const fetchNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      const lessonId = chatSession?.topicId || route.params?.topicId;
      if (!lessonId) {
        alert('No lesson ID available. Please generate a lesson first.');
        return;
      }
      const result = await generateNotes(lessonId);
      const note = result.data || result;

      note.updatedAt = new Date().toLocaleDateString();
      note.title = note.topic || chatSession?.title || 'Notes';

      navigation.navigate('NotesStack', {
        screen: 'NoteDetailScreen',
        params: { note: note, topic: { title: note.title } }
      });

    } catch (err) {
      alert(err.message || 'Error generating notes');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  fetchNotes();
  
    } else if (id === 'visual') {
      setMessages(prev => [
        ...prev,
        { id: 'visual-' + Date.now(), type: 'visual', timestamp: Date.now() },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } else if (id === 'practice') {
      const lessonId = chatSession?.topicId;
      if (!lessonId) {
        alert('No lesson ID available. Please generate a lesson first.');
        return;
      }
      navigation.navigate('HomeStack', {
        screen: 'QuizScreen',
        params: {
          topic: chatSession?.title || 'Lesson',
          lesson_id: lessonId,
        },
      });
    } else if (id === 'examples') {
      setMessages(prev => [
        ...prev,
        {
          id: 'b-ex-' + Date.now(),
          type: 'block',
          timestamp: Date.now(),
          block: {
            id: 'b-ex-' + Date.now(),
            type: 'think',
            question: 'Example: Fibonacci sequence',
            hint: 'Another classical use case for DP.',
            answer: 'fib(n) = fib(n-1) + fib(n-2). Instead of recomputing, store the values in an array.',
          },
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } else if (id === 'retry') {
      const fetchRetry = async () => {
        try {
          setMessages(prev => [...prev, { id: 'retry-loading', type: 'block', timestamp: Date.now(), block: { id: 'r-load', type: 'paragraph', text: 'Thinking of a different way to explain...' } }]);
          
          const previous_strategy = chatSession?.teachingStrategy || 'step-by-step';
          const topicStr = chatSession?.title || 'this topic';
          const result = await generateRetryExplanation(topicStr, previous_strategy);
          const retryObj = result.data || result;
          
          await trackLearnerEvent({
            type: 'retry_requested',
            topic: topicStr,
            strategyUsed: retryObj.strategy || previous_strategy
          });
          
          setMessages(prev => {
            const withoutLoading = prev.filter(m => m.id !== 'retry-loading');
            // Backend retry returns a LessonJSON: { version, title, ..., sections: [...] }
            const sections = retryObj.content && Array.isArray(retryObj.content.sections)
              ? retryObj.content.sections
              : Array.isArray(retryObj.content) ? retryObj.content : null;
            if (sections) {
              const sectionMsgs = sections.map((section, i) => ({
                id: 'retry-s-' + Date.now() + '-' + i,
                type: 'block',
                timestamp: Date.now() + i,
                block: section,
              }));
              return [...withoutLoading, ...sectionMsgs];
            } else if (retryObj.explanation) {
              return [...withoutLoading, { id: 'retry-' + Date.now(), type: 'block', timestamp: Date.now(), block: { id: 'r-' + Date.now(), type: 'paragraph', text: retryObj.explanation } }];
            }
            return withoutLoading;
          });
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
        } catch (err) {
          alert(err.message || 'Error fetching explanation');
          setMessages(prev => prev.filter(m => m.id !== 'retry-loading'));
        }
      };
      fetchRetry();
    }
  };

  // ── Inline content actions ────────────────────────────────────────────────
  const handleInlineAction = (label) => {
    // placeholder
  };

  // ── Send note / question — APPEND-ONLY to messages ───────────────────────
  const sendNote = () => {
    const text = inputText.trim();
    if (!text) return;
    const msgId = Date.now().toString();
    const newNote = { id: msgId, text };
    if (chatSession?.id) {
      saveChatNote(chatSession.id, newNote);
    }
    setMessages(prev => [
      ...prev,
      { id: msgId, type: 'userNote', timestamp: Date.now(), text },
    ]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  // ── Evaluate MCQ answer — appends evaluation message AFTER the question ───
  const handleEvaluate = (practiceId, { selectedKey, correctKey, explanations }) => {
    const isCorrect = selectedKey === correctKey;
    const explanation = explanations[selectedKey];
    const correctLabel = explanations[correctKey];

    let feedbackHeader, feedbackBody;
    if (isCorrect) {
      feedbackHeader = '✓ Nice, that\'s correct.';
      feedbackBody = explanation;
    } else {
      feedbackHeader = '✗ Not quite — here\'s why:';
      feedbackBody = `You chose ${selectedKey}: ${explanation}\n\nThe correct answer is ${correctKey}: ${correctLabel}`;
    }

    setMessages(prev => [
      ...prev,
      {
        id: 'eval-' + Date.now(),
        type: 'evaluation',
        timestamp: Date.now(),
        result: isCorrect ? 'correct' : 'incorrect',
        selected: selectedKey,
        correct: correctKey,
        feedbackHeader,
        feedbackBody,
        practiceId, // links this evaluation back to its question card
      },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const isThreadEmpty = messages.length === 0;

  useEffect(() => {
    if (route.params?.topicId) {
      updateLessonProgress(route.params.topicId, { status: 'in_progress', progress: 0.5 }).catch(console.error);
    }
  }, [route.params?.topicId]);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    if (isBottom && !scrollRef.current?.hasMarkedComplete) {
      scrollRef.current.hasMarkedComplete = true;
      if (route.params?.topicId) {
        updateLessonProgress(route.params.topicId, { status: 'completed', progress: 1 }).catch(console.error);
        trackLearnerEvent({ type: 'lesson_complete', topic: chatSession?.title }).catch(console.error);
        
        // update local state
        if (chatSession) chatSession.progress = 1;
      }
    }
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatSession?.title || 'Unknown Topic'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {chatSession?.subject || 'Study'} · {chatSession?.subtitle || 'Notes'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            setBookmarked((b) => {
              const next = !b;
              if (chatSession) chatSession.bookmarked = next;
              return next;
            });
          }}
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

      {/* ── GENERATING NOTES BANNER ── */}
      {isGeneratingNotes && (
        <View style={styles.generatingNotesBanner}>
          <ActivityIndicator size="small" color={Colors.yellow} />
          <Text style={styles.generatingNotesText}>Generating notes...</Text>
        </View>
      )}

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
onScrollBeginDrag={() => {
  collapsePanel();
  if (activeNoteId) setActiveNoteId(null);
}}
onScroll={handleScroll}
scrollEventThrottle={16}
          // ↓ Disable scroll while user is dragging or resizing a note
          scrollEnabled={!isDraggingNote}
        >
          {/* ─── Empty state for new thread ─── */}
          {isThreadEmpty ? (
            <View style={styles.emptyThread}>
              <Text style={styles.emptyThreadIcon}>✦</Text>
              <Text style={styles.emptyThreadTitle}>New learning thread</Text>
              <Text style={styles.emptyThreadHint}>
                Ask a question, paste a topic, or just start writing.
              </Text>
            </View>
          ) : (
            /* ─── Unified chronological message list ─── */
            messages.map((msg) => {
              if (msg.type === 'block') {
                return (
                  <NotebookBlock
                    key={msg.id}
                    block={msg.block}
                    onInlineAction={handleInlineAction}
                  />
                );
              }
              if (msg.type === 'userNote') {
                return (
                  <View key={msg.id} style={styles.userNote}>
                    <Text style={styles.userNoteText}>{msg.text}</Text>
                  </View>
                );
              }
              if (msg.type === 'visual') {
                return (
                  <View key={msg.id} style={styles.visualMockContainer}>
                    <View style={styles.visualMockVideo}>
                      <Ionicons name="play-circle" size={48} color={Colors.yellow} />
                      <Text style={styles.visualMockText}>Visual Explanation Playing...</Text>
                    </View>
                  </View>
                );
              }
              if (msg.type === 'practice') {
                return (
                  <PracticeCard
                    key={msg.id}
                    msg={msg}
                    onEvaluate={handleEvaluate}
                    // Freeze the card if an evaluation for this question already exists
                    evaluated={messages.some(m => m.type === 'evaluation' && m.practiceId === msg.id)}
                  />
                );
              }
              if (msg.type === 'evaluation') {
                const isCorrect = msg.result === 'correct';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.evaluationCard,
                      isCorrect ? styles.evaluationCorrect : styles.evaluationIncorrect,
                    ]}
                  >
                    <Text style={[
                      styles.evaluationHeader,
                      isCorrect ? styles.evaluationHeaderCorrect : styles.evaluationHeaderIncorrect,
                    ]}>
                      {msg.feedbackHeader}
                    </Text>
                    <Text style={styles.evaluationBody}>{msg.feedbackBody}</Text>
                  </View>
                );
              }
              return null;
            })
          )}

          {/*
            ── STICKY NOTE LAYER ────────────────────────────────────────────────
            Anchored INSIDE ScrollView content so notes scroll with chat.
            Position absolute within this container — notes are independently
            placed via offsetX/offsetY relative to this layer.
            Height is large enough to contain all note positions.
          */}
          {stickyNotes.length > 0 && (
            <View
              style={styles.noteLayer}
              // Tap on the empty area of the note layer (not on a note) → deactivate
              onStartShouldSetResponder={() => {
                if (activeNoteId) {
                  setActiveNoteId(null);
                  return true;
                }
                return false;
              }}
            >
              {stickyNotes.map((note) => (
                <DraggableStickyNote
                  key={note.id}
                  note={note}
                  isActive={activeNoteId === note.id}
                  onActivate={setActiveNoteId}
                  onUpdate={updateStickyNote}
                  onRemove={removeStickyNote}
                  onDragStart={() => setIsDraggingNote(true)}
                  onDragEnd={() => setIsDraggingNote(false)}
                />
              ))}
            </View>
          )}
        </ScrollView>


        {/* ── FIXED BOTTOM ── */}
        <View
          style={[
            styles.bottomFixed,
            { paddingBottom: insets.bottom },
          ]}
        >
          {/* ── STICKY NOTE TOOLBAR (shown only when a note is active) ── */}
          <StickyNoteToolbar
            activeNote={stickyNotes.find((n) => n.id === activeNoteId) || null}
            onUpdate={updateStickyNote}
            onDeactivate={() => setActiveNoteId(null)}
          />

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
                    disabled={action.id === 'notes' && isGeneratingNotes}
                  >
                    {action.id === 'notes' && isGeneratingNotes ? (
                      <ActivityIndicator size="small" color={Colors.yellow} />
                    ) : (
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    )}
                    <Animated.Text
                      style={[styles.panelItemLabel, { opacity: labelOpacity }]}
                      numberOfLines={2}
                    >
                      {action.id === 'notes' && isGeneratingNotes ? 'Generating...' : action.label}
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

    // ── Intro section — opening text with subtle accent ───────────────────
    case 'intro':
      return (
        <View style={nb.block}>
          <Text style={nb.introText}>{block.content}</Text>
        </View>
      );

    // ── Explanation section — main content text ──────────────────────────
    case 'explanation':
      return (
        <View style={nb.block}>
          <Text style={nb.para}>{block.content}</Text>
        </View>
      );

    // ── Example section — labelled example block ─────────────────────────
    case 'example':
      return (
        <View style={[nb.block, nb.exampleWrap]}>
          {block.label ? (
            <Text style={nb.exampleLabel}>{block.label}</Text>
          ) : null}
          <Text style={nb.para}>{block.content}</Text>
        </View>
      );

    // ── Insight section — highlighted callout ─────────────────────────────
    case 'insight':
      return (
        <View style={[nb.block, nb.insightWrap]}>
          <Text style={nb.insightText}>{block.content}</Text>
        </View>
      );

    // ── Summary section — key takeaway bullets ───────────────────────────
    case 'summary':
      return (
        <View style={[nb.block, nb.summaryWrap]}>
          <Text style={nb.summaryHeading}>Key Takeaways</Text>
          {Array.isArray(block.bullets) && block.bullets.map((bullet, i) => (
            <View key={i} style={nb.summaryBulletRow}>
              <Text style={nb.summaryBulletDot}>•</Text>
              <Text style={nb.summaryBulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      );

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
          {block.language ? (
            <Text style={nb.codeLang}>{block.language}</Text>
          ) : null}
          <View style={nb.codeWrap}>
            <Text style={nb.codeText}>{block.code || block.content}</Text>
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
// PracticeCard — interactive MCQ with selection + submit + freeze-after-submit
// ─────────────────────────────────────────────────────────────────────────────
const PracticeCard = ({ msg, onEvaluate, evaluated }) => {
  const [selectedKey, setSelectedKey] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const isLocked = submitted || evaluated;

  const handleSubmit = () => {
    if (!selectedKey || isLocked) return;
    setSubmitted(true);
    onEvaluate(msg.id, {
      selectedKey,
      correctKey: msg.correctKey,
      explanations: msg.explanations,
    });
  };

  return (
    <View style={styles.practiceMockContainer}>
      <Text style={styles.practiceTitle}>Practice: Quick Quiz</Text>
      <Text style={styles.practiceQuestion}>{msg.question}</Text>

      {msg.options.map((opt) => {
        const isSelected = selectedKey === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.practiceOption,
              isSelected && styles.practiceOptionSelected,
              isLocked && styles.practiceOptionLocked,
            ]}
            onPress={() => !isLocked && setSelectedKey(opt.key)}
            activeOpacity={isLocked ? 1 : 0.7}
          >
            <View style={styles.practiceOptionRow}>
              <View style={[styles.practiceOptionBadge, isSelected && styles.practiceOptionBadgeSelected]}>
                <Text style={[styles.practiceOptionBadgeText, isSelected && styles.practiceOptionBadgeTextSelected]}>
                  {opt.key}
                </Text>
              </View>
              <Text style={[styles.practiceOptionText, isSelected && styles.practiceOptionTextSelected]}>
                {opt.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {!isLocked && (
        <TouchableOpacity
          style={[styles.practiceSubmitBtn, !selectedKey && styles.practiceSubmitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={selectedKey ? 0.8 : 1}
        >
          <Text style={[styles.practiceSubmitText, !selectedKey && styles.practiceSubmitTextDisabled]}>
            Submit Answer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const nb = StyleSheet.create({
  block: {
    marginBottom: 20,
  },

  // Intro
  introText: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },

  // Example
  exampleWrap: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.textMuted,
    borderRadius: 4,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 12,
  },
  exampleLabel: {
    color: Colors.yellow,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Insight
  insightWrap: {
    backgroundColor: 'rgba(232,212,77,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.yellow,
    borderRadius: 4,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 12,
  },
  insightText: {
    color: Colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Summary
  summaryWrap: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryHeading: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  summaryBulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  summaryBulletDot: {
    color: Colors.yellow,
    fontSize: 15,
    lineHeight: 22,
    width: 16,
  },
  summaryBulletText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },

  // Code language label
  codeLang: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
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
  visualMockContainer: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  visualMockVideo: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualMockText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  practiceMockContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(232,212,77,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,212,77,0.3)',
  },
  practiceTitle: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  practiceQuestion: {
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
  },
  practiceOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  practiceOptionSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.1)',
  },
  practiceOptionLocked: {
    opacity: 0.7,
  },
  practiceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  practiceOptionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceOptionBadgeSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(232,212,77,0.2)',
  },
  practiceOptionBadgeText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  practiceOptionBadgeTextSelected: {
    color: Colors.yellow,
  },
  practiceOptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  practiceOptionTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // ── Submit button ─────────────────────────────────────────────────────────
  practiceSubmitBtn: {
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceSubmitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  practiceSubmitText: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  practiceSubmitTextDisabled: {
    color: Colors.textMuted,
  },

  // ── Evaluation card ───────────────────────────────────────────────────────
  evaluationCard: {
    marginTop: 4,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  evaluationCorrect: {
    backgroundColor: 'rgba(52,199,89,0.07)',
    borderColor: 'rgba(52,199,89,0.3)',
  },
  evaluationIncorrect: {
    backgroundColor: 'rgba(255,69,58,0.07)',
    borderColor: 'rgba(255,69,58,0.25)',
  },
  evaluationHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  evaluationHeaderCorrect: {
    color: '#34C759',
  },
  evaluationHeaderIncorrect: {
    color: '#FF453A',
  },
  evaluationBody: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  generatingNotesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,212,77,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,212,77,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  generatingNotesText: {
    color: Colors.yellow,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default ChatScreen;
