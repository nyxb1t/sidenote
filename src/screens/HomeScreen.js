import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';
import QuickActionButton from '../components/QuickActionButton';
import { QUICK_ACTIONS } from '../data/mockData';
import { globalState, addSyllabus, addNotes, addAssignment } from '../data/globalState';
import { uploadFile } from '../services/aiService';
import Colors from '../theme/colors';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

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

  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [hasSyllabusLoc, setHasSyllabusLoc] = useState(globalState.syllabusHistory.length > 0);
  const [hasNotesLoc, setHasNotesLoc] = useState(globalState.notesHistory.length > 0);
  const [hasAssignmentsLoc, setHasAssignmentsLoc] = useState(globalState.assignmentHistory.length > 0);

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'application/pdf';
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: mime,
          type: mime,
          size: asset.size,
        });
        if (!inputTitle.trim()) {
          const defaultName = asset.name.replace(/\.[^/.]+$/, '');
          setInputTitle(defaultName);
        }
      }
    } catch (e) {
      setErrorMessage('Could not open document picker. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Permission to access photos is required to upload images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        const fileName = `image_${Date.now()}.${ext}`;
        const mime = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: mime,
          type: mime,
          size: asset.fileSize,
        });
        if (!inputTitle.trim()) {
          setInputTitle('Image Upload');
        }
      }
    } catch (e) {
      setErrorMessage('Could not open image picker. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setHasSyllabusLoc(globalState.syllabusHistory.length > 0);
      setHasNotesLoc(globalState.notesHistory.length > 0);
      setHasAssignmentsLoc(globalState.assignmentHistory.length > 0);
      setRecentChat(globalState.chatSessions.find((c) => !globalState.deletedChats.includes(c.id)));
    }, [])
  );

  const resetModalFields = () => {
    setInputTitle('');
    setInputText('');
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleSyllabusAction = () => {
    if (hasSyllabusLoc) {
      navigation.navigate('SyllabusHistoryScreen');
    } else {
      resetModalFields();
      setSyllabusModal(true);
    }
  };

  const handleNotesAction = () => {
    if (hasNotesLoc) {
      navigation.navigate('NotesHistoryScreen');
    } else {
      resetModalFields();
      setNotesModal(true);
    }
  };

  const handleAssignmentAction = () => {
    if (hasAssignmentsLoc) {
      navigation.navigate('AssignmentHistoryScreen');
    } else {
      resetModalFields();
      setAssignmentModal(true);
    }
  };

  const handleTestMeAction = () => {
    navigation.navigate('TopicSelectionScreen');
  };

  const parseSyllabusTopics = (text, title, fileName) => {
    let topics = [];
    if (text && text.trim()) {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\d\.\-\*\•\)\s]+/, '').trim())
        .filter((l) => l.length > 2);
      if (lines.length > 0) {
        topics = lines;
      }
    }
    if (topics.length === 0) {
      const baseTitle = title || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Syllabus');
      topics = [
        `${baseTitle} — Fundamentals & Overview`,
        `${baseTitle} — Core Concepts & Architecture`,
        `${baseTitle} — Practical Implementation`,
        `${baseTitle} — Advanced Topics & Optimization`,
        `${baseTitle} — Review & Practice Exercises`,
      ];
    }
    return topics;
  };

  const handleSaveSyllabus = async () => {
    if (!inputTitle.trim()) {
      setErrorMessage('Please enter a title / name to continue');
      return;
    }
    if (!inputText.trim() && !selectedFile) {
      setErrorMessage('Please add content to continue');
      return;
    }

    let fileUploadResult = null;
    if (selectedFile) {
      if (!selectedFile.uri) {
        setErrorMessage('Invalid file selected');
        return;
      }
      setIsUploading(true);
      try {
        fileUploadResult = await uploadFile(selectedFile);
      } catch (e) {
        setIsUploading(false);
        setErrorMessage(e.message || 'Something went wrong while processing your file');
        return;
      }
      setIsUploading(false);
    }

    const parsedTopics = parseSyllabusTopics(inputText, inputTitle, selectedFile?.name);
    if (!parsedTopics || parsedTopics.length === 0) {
      setErrorMessage("Couldn't extract content from this file. Try another file or paste text.");
      return;
    }

    const newSyllabus = {
      id: Date.now().toString(),
      title: inputTitle.trim(),
      text: inputText.trim(),
      file: selectedFile,
      fileData: fileUploadResult?.data || null,
      parsedTopics,
      date: new Date().toLocaleDateString(),
    };

    addSyllabus(newSyllabus);
    setSyllabusModal(false);
    resetModalFields();
    navigation.navigate('SyllabusScreen', {
      syllabusId: newSyllabus.id,
      syllabus: newSyllabus,
    });
  };

  const handleSaveNotes = async () => {
    if (!inputTitle.trim()) {
      setErrorMessage('Please enter a title / name to continue');
      return;
    }
    if (!inputText.trim() && !selectedFile) {
      setErrorMessage('Please add content to continue');
      return;
    }

    let fileUploadResult = null;
    if (selectedFile) {
      if (!selectedFile.uri) {
        setErrorMessage('Invalid file selected');
        return;
      }
      setIsUploading(true);
      try {
        fileUploadResult = await uploadFile(selectedFile);
      } catch (e) {
        setIsUploading(false);
        setErrorMessage(e.message || 'Something went wrong while processing your file');
        return;
      }
      setIsUploading(false);
    }

    const newNotes = {
      id: Date.now().toString(),
      title: inputTitle.trim(),
      text: inputText.trim(),
      file: selectedFile,
      fileData: fileUploadResult?.data || null,
      date: new Date().toLocaleDateString(),
    };

    addNotes(newNotes);
    setNotesModal(false);
    resetModalFields();
    navigation.navigate('NotesHistoryScreen');
  };

  const handleSaveAssignment = async () => {
    if (!inputTitle.trim()) {
      setErrorMessage('Please enter a title / name to continue');
      return;
    }
    if (!inputText.trim() && !selectedFile) {
      setErrorMessage('Please add content to continue');
      return;
    }

    let fileUploadResult = null;
    if (selectedFile) {
      if (!selectedFile.uri) {
        setErrorMessage('Invalid file selected');
        return;
      }
      setIsUploading(true);
      try {
        fileUploadResult = await uploadFile(selectedFile);
      } catch (e) {
        setIsUploading(false);
        setErrorMessage(e.message || 'Something went wrong while processing your file');
        return;
      }
      setIsUploading(false);
    }

    const newAssignment = {
      id: Date.now().toString(),
      title: inputTitle.trim(),
      text: inputText.trim(),
      file: selectedFile,
      fileData: fileUploadResult?.data || null,
      date: new Date().toLocaleDateString(),
    };

    addAssignment(newAssignment);
    setAssignmentModal(false);
    resetModalFields();
    navigation.navigate('AssignmentChatScreen');
  };

  const user = globalState?.user || {
    name: 'User',
    email: 'example@email.com',
    phone: '',
  };

  const modals = [
    {
      key: 'syllabus',
      visible: syllabusModal,
      setVisible: setSyllabusModal,
      title: 'Upload Syllabus',
      buttonLabel: 'Save',
      onSave: handleSaveSyllabus,
    },
    {
      key: 'notes',
      visible: notesModal,
      setVisible: setNotesModal,
      title: 'Upload Notes',
      buttonLabel: 'Save',
      onSave: handleSaveNotes,
    },
    {
      key: 'assignment',
      visible: assignmentModal,
      setVisible: setAssignmentModal,
      title: 'New Assignment',
      buttonLabel: 'Submit',
      onSave: handleSaveAssignment,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
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

          {/* ── SECTION 2: GREETING ── */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user.name}.
            </Text>
            <Text style={styles.greetingSub}>
              Pick up where you left off — or start something new
            </Text>
          </View>

          {/* ── SECTION 3: CONTINUE LEARNING ── */}
          <View style={styles.continueSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>continue learning</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ContinueLearningScreen')}>
                <Text style={styles.viewAll}>view all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.topicRow}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ChatStack', {
                  screen: 'Chat',
                  params: {
                    chatId: recentChat?.id,
                    topicId: recentChat?.topicId || recentChat?.id,
                    topicTitle: recentChat?.title,
                    isNewChat: false,
                  },
                })
              }
            >
              <View style={styles.topicIcon}>
                <Ionicons name="trending-up" size={18} color={Colors.yellow} />
              </View>

              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{recentChat?.title || 'No active chats'}</Text>
                <Text style={styles.topicSubtitle}>{recentChat?.subtitle || 'Start learning'}</Text>

                <View style={styles.progressRow}>
                  <ProgressBar
                    progress={recentChat?.progress || 0}
                    height={5}
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressPct}>
                    {Math.round((recentChat?.progress || 0) * 100)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── SECTION 4: QUICK ACTIONS ── */}
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
                    else handleTestMeAction();
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* MODALS */}
        {modals.map((modalData) => {
          const isSaveDisabled =
            !inputTitle.trim() || (!inputText.trim() && !selectedFile) || isUploading;

          return (
            <Modal
              key={modalData.key}
              visible={modalData.visible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                modalData.setVisible(false);
                resetModalFields();
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalBg}
              >
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>{modalData.title}</Text>
                  <Text style={styles.modalSub}>
                    Enter a title and upload a file or paste text below
                  </Text>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ gap: 14 }}
                  >
                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Title / Name</Text>
                      <TextInput
                        style={styles.modalTitleInput}
                        placeholder="Enter Title / Name"
                        placeholderTextColor={Colors.textMuted}
                        value={inputTitle}
                        onChangeText={setInputTitle}
                        autoCapitalize="words"
                      />
                    </View>

                    {/* Attachment Options / Preview */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Attachment</Text>
                      {!selectedFile ? (
                        <View style={styles.uploadOptionsRow}>
                          <TouchableOpacity
                            style={styles.uploadOptionBtn}
                            onPress={handlePickPDF}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="document-text-outline" size={20} color={Colors.yellow} />
                            <Text style={styles.uploadOptionText}>PDF / Doc</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.uploadOptionBtn}
                            onPress={handlePickImage}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="image-outline" size={20} color={Colors.yellow} />
                            <Text style={styles.uploadOptionText}>Image</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.filePreviewRow}>
                          <Ionicons
                            name={selectedFile.type === 'PDF' ? 'document-text' : 'image'}
                            size={20}
                            color={Colors.yellow}
                          />
                          <Text style={styles.fileNameText} numberOfLines={1}>
                            {selectedFile.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedFile(null)}
                            style={styles.removeFileBtn}
                          >
                            <Ionicons name="close-circle" size={20} color={Colors.coral} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <Text style={styles.orDivider}>— OR —</Text>

                    {/* Content Text Box */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Content</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder={`Type or paste ${modalData.key} text here...`}
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        value={inputText}
                        onChangeText={setInputText}
                      />
                    </View>
                  </ScrollView>

                  {/* Modal Action Buttons */}
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.modalBtnCancel}
                      onPress={() => {
                        modalData.setVisible(false);
                        resetModalFields();
                      }}
                      disabled={isUploading}
                    >
                      <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtnSubmit, isSaveDisabled && styles.submitDisabled]}
                      disabled={isSaveDisabled}
                      onPress={modalData.onSave}
                    >
                      {isUploading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color="#1C1C1E" />
                          <Text style={styles.modalBtnTextSubmit}>Processing...</Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.modalBtnTextSubmit,
                            isSaveDisabled && styles.submitTextDisabled,
                          ]}
                        >
                          {modalData.buttonLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          );
        })}

        {/* ERROR / VALIDATION ALERT MODAL */}
        <Modal
          visible={!!errorMessage}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorMessage(null)}
        >
          <View style={styles.alertBg}>
            <View style={styles.alertCard}>
              <View style={styles.alertIconBox}>
                <Ionicons name="alert-circle" size={28} color={Colors.coral} />
              </View>
              <Text style={styles.alertTitle}>Notice</Text>
              <Text style={styles.alertText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => setErrorMessage(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.alertBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileBtn: {},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 16,
  },
  greetingSection: {
    gap: 4,
    marginBottom: 24,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  continueSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  viewAll: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '500',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  topicContent: {
    flex: 1,
    gap: 6,
  },
  topicTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  topicSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
  },
  progressPct: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },
  quickSection: {
    marginTop: 125,
    gap: 14,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },

  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '88%',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalTitleInput: {
    backgroundColor: Colors.bg,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
  },
  uploadOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadOptionBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 8,
  },
  uploadOptionText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  filePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.yellow,
  },
  fileNameText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    marginHorizontal: 10,
    fontWeight: '500',
  },
  removeFileBtn: {
    padding: 4,
  },
  orDivider: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginVertical: 2,
    letterSpacing: 1.5,
  },
  modalInput: {
    backgroundColor: Colors.bg,
    color: Colors.textPrimary,
    padding: 12,
    borderRadius: 10,
    minHeight: 85,
    maxHeight: 130,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalBtnTextCancel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnSubmit: {
    backgroundColor: Colors.yellow,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  modalBtnTextSubmit: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 14,
  },
  submitTextDisabled: {
    color: '#1C1C1E',
  },

  // Alert Dialog
  alertBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 125, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  alertText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertBtn: {
    marginTop: 8,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HomeScreen;
