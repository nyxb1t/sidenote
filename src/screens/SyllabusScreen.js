import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { globalState, createChatForTopic } from '../data/globalState';
import Colors from '../theme/colors';

export default function SyllabusScreen({ route, navigation }) {
  const syllabusId = route.params?.syllabusId;
  const currentSyllabus =
    route.params?.syllabus ||
    globalState.syllabusHistory.find((s) => s.id === syllabusId) ||
    globalState.syllabusHistory[0];

  const topics =
    currentSyllabus?.parsedTopics && currentSyllabus.parsedTopics.length > 0
      ? currentSyllabus.parsedTopics
      : currentSyllabus?.text
      ? currentSyllabus.text
          .split(/\r?\n/)
          .map((l) => l.replace(/^[\d\.\-\*\•\)\s]+/, '').trim())
          .filter((l) => l.length > 2)
      : [];

  const handleStartTopic = (topicTitle, index) => {
    const session = createChatForTopic({
      topicId: `syl_${currentSyllabus?.id || 'gen'}_${index}`,
      topicTitle: topicTitle,
      subject: currentSyllabus?.title || 'Syllabus',
      subtitle: `Module ${index + 1}`,
    });

    navigation.navigate('ChatStack', {
      screen: 'Chat',
      params: {
        chatId: session.id,
        topicId: session.id,
        topicTitle: session.title,
        isNewChat: false,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentSyllabus?.title || 'Syllabus'}
        </Text>
        <TouchableOpacity
          style={styles.historyIconBtn}
          onPress={() => navigation.navigate('SyllabusHistoryScreen')}
        >
          <Ionicons name="list" size={22} color={Colors.yellow} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {currentSyllabus && (
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <View style={styles.metaIcon}>
                <Ionicons name="book-outline" size={22} color={Colors.yellow} />
              </View>
              <View style={styles.metaInfo}>
                <Text style={styles.metaTitle}>{currentSyllabus.title || 'Untitled Syllabus'}</Text>
                <Text style={styles.metaDate}>
                  {currentSyllabus.date || new Date().toLocaleDateString()}
                  {currentSyllabus.file?.name ? ` • ${currentSyllabus.file.name}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Parsed Topics ({topics.length})</Text>
          <Text style={styles.sectionSub}>Tap any topic to study</Text>
        </View>

        {topics.length > 0 ? (
          topics.map((topic, i) => (
            <TouchableOpacity
              key={i}
              style={styles.topicCard}
              activeOpacity={0.75}
              onPress={() => handleStartTopic(topic, i)}
            >
              <View style={styles.topicNumberBox}>
                <Text style={styles.topicNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.topicText}>{topic}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              No parsed topics found for this syllabus.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  historyIconBtn: {
    padding: 4,
    marginRight: -4,
  },
  listContainer: {
    padding: 20,
    gap: 14,
    paddingBottom: 36,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInfo: {
    flex: 1,
    gap: 2,
  },
  metaTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  metaDate: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  topicNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicNumber: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  topicText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
