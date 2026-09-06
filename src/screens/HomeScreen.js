import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';
import QuickActionButton from '../components/QuickActionButton';
import { QUICK_ACTIONS } from '../data/mockData';
import { globalState, addSyllabus, addNotes, addAssignment, createChatForTopic } from '../data/globalState';
import { generateLesson, uploadFile, trackLearnerEvent } from '../services/aiService';
import Colors from '../theme/colors';

const { height } = Dimensions.get('window');

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeScreen = ({ navigation }) => {
  const [recentChat, setRecentChat] = useState(null);
  const [syllabusModal, setSyllabusModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [lessonModal, setLessonModal] = useState(false);
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDifficulty, setLessonDifficulty] = useState('beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [hasSyllabusLoc, setHasSyllabusLoc] = useState(globalState.syllabusHistory.length > 0);
  const [hasNotesLoc, setHasNotesLoc] = useState(globalState.notesHistory.length > 0);
  const [hasAssignmentsLoc, setHasAssignmentsLoc] = useState(globalState.assignmentHistory.length > 0);

  const handleSimulateUpload = (type) => {
    // Simulate instant upload feeling
    const mockFile = {
      name: type === 'PDF' ? 'document_v2.pdf' : 'photo_upload.jpg',
      type: type === 'PDF' ? 'application/pdf' : 'image/jpeg',
      uri: 'file:///dummy/path/to/' + (type === 'PDF' ? 'document_v2.pdf' : 'photo_upload.jpg')
    };
    setSelectedFile(mockFile);
  };

  useFocusEffect(
    useCallback(() => {
      setHasSyllabusLoc(globalState.syllabusHistory.length > 0);
      setHasNotesLoc(globalState.notesHistory.length > 0);
      setHasAssignmentsLoc(globalState.assignmentHistory.length > 0);
      setRecentChat(globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id)));
    }, [])
  );

  const handleSyllabusAction = () => {
    if (hasSyllabusLoc) {
      navigation.navigate('SyllabusHistoryScreen');
    } else {
      setInputText('');
      setSelectedFile(null);
      setSyllabusModal(true);
    }
  };

  const handleNotesAction = () => {
    if (hasNotesLoc) {
      navigation.navigate('NotesHistoryScreen');
    } else {
      setInputText('');
      setSelectedFile(null);
      setNotesModal(true);
    }
  };

  const handleLessonAction = () => {
    setLessonTopic('');
    setLessonDifficulty('beginner');
    setLessonModal(true);
  };

  const handleGenerateLesson = async () => {
    if (!lessonTopic.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateLesson(lessonTopic.trim(), lessonDifficulty);
      const lesson = result.data || result; // Fallback if wrapper is missing
      const session = createChatForTopic({ 
        topicId: lesson.id || Date.now().toString(), 
        topicTitle: lessonTopic, 
        subject: lesson.subject || 'Lesson', 
        subtitle: lesson.title || 'Generated Lesson' 
      });
      if (lesson.content && Array.isArray(lesson.content)) {
         session.blocks = lesson.content;
      }
      
      // Track session_start event
      trackLearnerEvent({ type: 'session_start', topic: lessonTopic }).catch(e => console.warn('Learner event failed:', e));
      
      setLessonModal(false);
      navigation.navigate('ChatStack', {
        screen: 'Chat',
        params: {
          topicId: session.id,
          topicTitle: session.title,
          isNewChat: false,
        }
      });
    } catch (err) {
      alert(err.message || 'Error generating lesson');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssignmentAction = () => {
    if (hasAssignmentsLoc) {
      navigation.navigate('AssignmentHistoryScreen');
    } else {
      setInputText('');
      setSelectedFile(null);
      setAssignmentModal(true);
    }
  };

  const handleTestMeAction = () => {
    navigation.navigate('TopicSelectionScreen');
  };

  const user = globalState?.user || {
    name: "User",
    email: "example@email.com",
    phone: ""
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.container}>

        {/* ── SECTION 1: HEADER ── */}
        <View style={styles.topBar}>
          <Text style={styles.appName}>sidenote</Text>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('ProfileStack')}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: MAIN CONTENT ── */}
        <View style={styles.mainContent}>

          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user.name}.
            </Text>
            <Text style={styles.greetingSub}>
              Pick up where you left off — or start something new
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueSection}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ChatStack', {
              screen: 'Chat',
              params: {
                topicId: recentChat?.topicId || recentChat?.id,
                topicTitle: recentChat?.title,
                isNewChat: false,
              }
            })}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>continue learning</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ContinueLearningScreen')}>
                <Text style={styles.viewAll}>view all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.topicRow}>
              <View style={styles.topicIcon}>
                <Ionicons name="trending-up" size={18} color={Colors.yellow} />
              </View>

              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{recentChat?.title || 'No active chats'}</Text>
                <Text style={styles.topicSubtitle}>{recentChat?.subtitle || 'Start learning'}</Text>

                <View style={styles.progressRow}>
                  <ProgressBar progress={(recentChat?.progress || 0)} height={5} style={styles.progressBar} />
                  <Text style={styles.progressPct}>
                    {Math.round((recentChat?.progress || 0) * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.midSpacer} />

        {/* ── SECTION 3: QUICK ACTIONS ── */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionLabel}>quick actions</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={() => {
                  if (action.id === 'syllabus') handleSyllabusAction();
                  else if (action.id === 'notes') handleNotesAction();
                  else if (action.id === 'assignment') handleAssignmentAction();
                  else if (action.id === 'lesson') handleLessonAction();
                  else handleTestMeAction();
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        {/* MODALS */}
        {/* Helper component for modal content to avoid repetition */}
        {[
          { key: 'syllabus', visible: syllabusModal, setVisible: setSyllabusModal, title: 'Upload Syllabus', onSave: () => { 
            addSyllabus({ id: Date.now().toString(), text: inputText, file: selectedFile, date: new Date().toLocaleDateString() });
            setSyllabusModal(false); 
            navigation.navigate('SyllabusHistoryScreen'); 
          } },
          { key: 'notes', visible: notesModal, setVisible: setNotesModal, title: 'Upload Notes', onSave: () => { 
            addNotes({ id: Date.now().toString(), text: inputText, file: selectedFile, date: new Date().toLocaleDateString() });
            setNotesModal(false); 
            navigation.navigate('NotesHistoryScreen'); 
          } },
          { key: 'assignment', visible: assignmentModal, setVisible: setAssignmentModal, title: 'New Assignment', onSave: () => { 
            addAssignment({ id: Date.now().toString(), text: inputText, file: selectedFile, date: new Date().toLocaleDateString() });
            setAssignmentModal(false); 
            navigation.navigate('AssignmentChatScreen'); 
          } }
        ].map((modalData) => (
          <Modal key={modalData.key} visible={modalData.visible} transparent animationType="slide">
            <View style={styles.modalBg}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{modalData.title}</Text>
                <Text style={styles.modalSub}>Upload a file or paste text below</Text>

                {!selectedFile ? (
                  <View style={styles.uploadOptionsRow}>
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={() => handleSimulateUpload('PDF')}>
                      <Ionicons name="document-text-outline" size={24} color={Colors.yellow} />
                      <Text style={styles.uploadOptionText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={() => handleSimulateUpload('Image')}>
                      <Ionicons name="image-outline" size={24} color={Colors.yellow} />
                      <Text style={styles.uploadOptionText}>Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.filePreviewRow}>
                    <Ionicons name={selectedFile.type === 'PDF' ? "document-text" : "image"} size={24} color={Colors.yellow} />
                    <Text style={styles.fileNameText} numberOfLines={1}>{selectedFile.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeFileBtn}>
                      <Ionicons name="close-circle" size={24} color={Colors.coral} />
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.orDivider}>— OR —</Text>

                <TextInput 
                  style={styles.modalInput} 
                  placeholder={`Type or paste ${modalData.key} text here...`} 
                  placeholderTextColor={Colors.textMuted} 
                  multiline 
                  value={inputText} 
                  onChangeText={setInputText} 
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { modalData.setVisible(false); setSelectedFile(null); }}>
                    <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtnSubmit, (!inputText.trim() && !selectedFile) && styles.submitDisabled]} 
                    disabled={!inputText.trim() && !selectedFile}
                    onPress={() => { modalData.onSave(); setSelectedFile(null); }}
                  >
                    <Text style={[styles.modalBtnTextSubmit, (!inputText.trim() && !selectedFile) && styles.submitTextDisabled]}>
                      {modalData.key === 'assignment' ? 'Submit' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ))}

        {/* GENERATE LESSON MODAL */}
        <Modal visible={lessonModal} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Generate Lesson</Text>
              <Text style={styles.modalSub}>Enter topic and select difficulty</Text>

              <TextInput 
                style={[styles.modalInput, { minHeight: 60, marginBottom: 12 }]} 
                placeholder="E.g. Photosynthesis" 
                placeholderTextColor={Colors.textMuted}
                value={lessonTopic}
                onChangeText={setLessonTopic}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24, gap: 8 }}>
                {['beginner', 'intermediate', 'advanced'].map(d => (
                  <TouchableOpacity 
                    key={d} 
                    onPress={() => setLessonDifficulty(d)}
                    style={{ 
                      flex: 1, 
                      alignItems: 'center',
                      paddingVertical: 10, 
                      borderRadius: 8, 
                      backgroundColor: lessonDifficulty === d ? Colors.yellow : Colors.surface,
                      borderWidth: 1,
                      borderColor: lessonDifficulty === d ? Colors.yellow : Colors.border
                    }}
                  >
                    <Text style={{ 
                      color: lessonDifficulty === d ? '#000' : Colors.textPrimary,
                      fontWeight: lessonDifficulty === d ? '700' : '500',
                      textTransform: 'capitalize'
                    }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setLessonModal(false)} disabled={isGenerating}>
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtnSubmit, (!lessonTopic.trim() || isGenerating) && styles.submitDisabled]} 
                  disabled={!lessonTopic.trim() || isGenerating}
                  onPress={handleGenerateLesson}
                >
                  <Text style={[styles.modalBtnTextSubmit, (!lessonTopic.trim() || isGenerating) && styles.submitTextDisabled]}>
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  appName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  profileBtn: {},
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#1C1C1E', fontWeight: '700', fontSize: 16 },
  mainContent: { gap: 32 },
  greetingSection: { gap: 6 },
  greeting: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.5 },
  greetingSub: { color: Colors.textMuted, fontSize: 14, lineHeight: 20 },
  continueSection: { gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  viewAll: { color: Colors.yellow, fontSize: 12, fontWeight: '500' },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: Colors.border },
  topicIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.yellowDim, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  topicContent: { flex: 1, gap: 6 },
  topicTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600' },
  topicSubtitle: { color: Colors.textSecondary, fontSize: 13 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  progressBar: { flex: 1 },
  progressPct: { color: Colors.yellow, fontSize: 11, fontWeight: '600', minWidth: 28, textAlign: 'right' },
  quickSection: { gap: 16 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  midSpacer: { flex: 2 },
  bottomSpacer: { flex: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: Colors.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '600', marginBottom: 8 },
  modalSub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 16 },
  uploadOptionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadOptionBtn: { flex: 1, backgroundColor: Colors.surfaceHigh, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, gap: 8 },
  uploadOptionText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  filePreviewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceHigh, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.yellow },
  fileNameText: { flex: 1, color: Colors.textPrimary, fontSize: 14, marginHorizontal: 12, fontWeight: '500' },
  removeFileBtn: { padding: 4 },
  orDivider: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 16, letterSpacing: 1 },
  modalInput: { backgroundColor: Colors.bg, color: Colors.textPrimary, padding: 16, borderRadius: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { padding: 12 },
  modalBtnTextCancel: { color: Colors.textSecondary, fontWeight: '600' },
  modalBtnSubmit: { backgroundColor: Colors.yellow, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  submitDisabled: { opacity: 0.5 },
  modalBtnTextSubmit: { color: '#1C1C1E', fontWeight: '700' },
  submitTextDisabled: { color: Colors.textMuted },
});

export default HomeScreen;
