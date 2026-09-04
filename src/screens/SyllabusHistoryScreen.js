import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { globalState, addSyllabus, removeSyllabus } from '../data/globalState';
import Colors from '../theme/colors';

export default function SyllabusHistoryScreen({ navigation }) {
  const [history, setHistory] = useState(globalState.syllabusHistory);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const handleSimulateUpload = (type) => {
    setSelectedFile({
      name: type === 'PDF' ? 'syllabus_v2.pdf' : 'syllabus_photo.jpg',
      type: type,
    });
  };

  const handleSave = () => {
    addSyllabus({
      id: Date.now().toString(),
      text: inputText,
      file: selectedFile,
      date: new Date().toLocaleDateString(),
    });
    setModalVisible(false);
    setInputText('');
    setSelectedFile(null);
    navigation.navigate('SyllabusScreen');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syllabus History</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.yellow} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
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
                    navigation.navigate('SyllabusScreen');
                  }
                }}
              >
                <View style={styles.historyInfo}>
                  <View style={styles.historyIconBox}>
                    <Ionicons name="book-outline" size={20} color={Colors.yellow} />
                  </View>
                  <View style={styles.historyTextContent}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.text ? item.text : item.file?.name}
                    </Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                </View>
                {isSelectionMode ? (
                  <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSelected ? Colors.coral : Colors.textMuted} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {history.length > 0 && !isSelectionMode && (
          <TouchableOpacity style={styles.removeActionBtn} onPress={() => setIsSelectionMode(true)}>
            <Text style={styles.removeActionBtnText}>Remove Items</Text>
          </TouchableOpacity>
        )}

        {isSelectionMode && (
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmRemoveBtn, selectedIds.length === 0 && styles.disabledBtn]} 
              disabled={selectedIds.length === 0}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.confirmRemoveBtnText}>Remove ({selectedIds.length})</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Syllabus</Text>
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
              placeholder="Type or paste syllabus text here..." 
              placeholderTextColor={Colors.textMuted} 
              multiline 
              value={inputText} 
              onChangeText={setInputText} 
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setModalVisible(false); setSelectedFile(null); }}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnSubmit, (!inputText.trim() && !selectedFile) && styles.submitDisabled]} 
                disabled={!inputText.trim() && !selectedFile}
                onPress={handleSave}
              >
                <Text style={[styles.modalBtnTextSubmit, (!inputText.trim() && !selectedFile) && styles.submitTextDisabled]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  addBtn: { padding: 4, marginRight: -4 },
  container: { padding: 20, gap: 12 },
  emptyStateBox: { backgroundColor: Colors.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  emptyStateText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  historyInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  historyIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  historyTextContent: { flex: 1, gap: 4 },
  historyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  historyDate: { color: Colors.textMuted, fontSize: 12 },
  chatActionBtn: { padding: 8, backgroundColor: Colors.surfaceHigh, borderRadius: 8 },
  historyCardSelected: { borderColor: Colors.coral, backgroundColor: 'rgba(255, 107, 107, 0.05)' },
  
  removeActionBtn: { marginTop: 12, padding: 16, alignItems: 'center' },
  removeActionBtnText: { color: Colors.coral, fontWeight: '600', fontSize: 16 },
  
  selectionActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceHigh, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 16 },
  confirmRemoveBtn: { flex: 1, backgroundColor: 'rgba(255, 107, 107, 0.15)', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.coral },
  confirmRemoveBtnText: { color: Colors.coral, fontWeight: '600', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },

  // Modal Styles
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
