import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { globalState, addSyllabus, removeSyllabus } from '../data/globalState';
import { uploadFile } from '../services/aiService';
import Colors from '../theme/colors';

export default function SyllabusHistoryScreen({ navigation }) {
  const [history, setHistory] = useState(globalState.syllabusHistory);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    removeSyllabus(selectedIds);
    setHistory([...globalState.syllabusHistory]);
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  useFocusEffect(
    useCallback(() => {
      setHistory([...globalState.syllabusHistory]);
    }, [])
  );

  const resetModal = () => {
    setInputTitle('');
    setInputText('');
    setSelectedFile(null);
    setIsUploading(false);
  };

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
        const fileName = `syllabus_image.${ext}`;
        const mime = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: mime,
          type: mime,
          size: asset.fileSize,
        });
        if (!inputTitle.trim()) {
          setInputTitle('Syllabus Image');
        }
      }
    } catch (e) {
      setErrorMessage('Could not open image picker. Please try again.');
    }
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

  const handleSave = async () => {
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
    setModalVisible(false);
    resetModal();
    setHistory([...globalState.syllabusHistory]);
    navigation.navigate('SyllabusScreen', {
      syllabusId: newSyllabus.id,
      syllabus: newSyllabus,
    });
  };

  const isSaveDisabled =
    !inputTitle.trim() || (!inputText.trim() && !selectedFile) || isUploading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syllabus History</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetModal();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color={Colors.yellow} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>No syllabus added yet.</Text>
          </View>
        ) : (
          history.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyCard, isSelected && styles.historyCardSelected]}
                onPress={() => {
                  if (isSelectionMode) {
                    toggleSelection(item.id);
                  } else {
                    navigation.navigate('SyllabusScreen', {
                      syllabusId: item.id,
                      syllabus: item,
                    });
                  }
                }}
              >
                <View style={styles.historyInfo}>
                  <View style={styles.historyIconBox}>
                    <Ionicons name="book-outline" size={20} color={Colors.yellow} />
                  </View>
                  <View style={styles.historyTextContent}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.title || item.text || item.file?.name || 'Untitled Syllabus'}
                    </Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                </View>
                {isSelectionMode ? (
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? Colors.coral : Colors.textMuted}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {history.length > 0 && !isSelectionMode && (
          <TouchableOpacity
            style={styles.removeActionBtn}
            onPress={() => setIsSelectionMode(true)}
          >
            <Text style={styles.removeActionBtnText}>Remove Items</Text>
          </TouchableOpacity>
        )}

        {isSelectionMode && (
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmRemoveBtn,
                selectedIds.length === 0 && styles.disabledBtn,
              ]}
              disabled={selectedIds.length === 0}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.confirmRemoveBtnText}>
                Remove ({selectedIds.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          resetModal();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Syllabus</Text>
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

              {/* Attachment */}
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

              {/* Text Input Box */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Content</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Type or paste syllabus text here..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                />
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setModalVisible(false);
                  resetModal();
                }}
                disabled={isUploading}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSubmit, isSaveDisabled && styles.submitDisabled]}
                disabled={isSaveDisabled}
                onPress={handleSave}
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
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  addBtn: { padding: 4, marginRight: -4 },
  container: { padding: 20, gap: 12 },
  emptyStateBox: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyStateText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextContent: { flex: 1, gap: 4 },
  historyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  historyDate: { color: Colors.textMuted, fontSize: 12 },
  historyCardSelected: {
    borderColor: Colors.coral,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },

  removeActionBtn: { marginTop: 12, padding: 16, alignItems: 'center' },
  removeActionBtnText: { color: Colors.coral, fontWeight: '600', fontSize: 16 },

  selectionActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 16 },
  confirmRemoveBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.coral,
  },
  confirmRemoveBtnText: { color: Colors.coral, fontWeight: '600', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },

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
