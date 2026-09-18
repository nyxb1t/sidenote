import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';
import { globalState, removeChat } from '../data/globalState';
import Colors from '../theme/colors';
import { fetchBackendLessons } from '../services/aiService';

export default function ContinueLearningScreen({ navigation }) {
  const [inProgressTopics, setInProgressTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        try {
          const result = await fetchBackendLessons();
          const rows = result?.data || [];
          if (!cancelled) {
            // Transform rows into expected shape for UI
            const active = rows.map(r => ({
              id: r.id,
              subject: r.topic || 'General',
              title: r.topic || 'Untitled',
              progress: r.progress || 0.1, // mock a default progress if 0 so it shows up in "in progress"
              timeAgo: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'recently',
              color: '#34C759', // default green
              topicId: r.id,
              initialMessage: r.content?.overview || 'Ready to learn',
            })).filter(t => !globalState.deletedChats.includes(t.id));
            setInProgressTopics(active);
          }
        } catch (e) {
          if (!cancelled) console.warn('Failed to load lessons', e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? Doing so will also remove any learning history related to it.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            removeChat(id);
            setInProgressTopics(prev => prev.filter(t => t.id !== id));
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Continue Learning</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {inProgressTopics.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>No active chats found.</Text>
          </View>
        ) : (
          inProgressTopics.map(topic => (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChatStack', {
                screen: 'Chat',
                params: {
                  topicId: topic.id,
                  topicTitle: topic.title,
                  isNewChat: false,
                }
              })}
            >
              <View style={styles.topicIcon}>
                <Ionicons name="trending-up" size={18} color={Colors.yellow} />
              </View>

              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSubtitle}>{topic.preview}</Text>

                <View style={styles.progressRow}>
                  <ProgressBar progress={topic.progress} height={5} style={styles.progressBar} />
                  <Text style={styles.progressPct}>
                    {Math.round(topic.progress * 100)}%
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(topic.id)}>
                <Ionicons name="trash-outline" size={20} color={Colors.coral} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
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
    fontSize: 17,
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
    marginTop: 12,
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
  deleteBtn: {
    padding: 8,
    marginRight: -8,
  },
  emptyStateBox: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
