import { THREADS, NOTES, TOPIC_NOTES, USER } from './mockData';

// Helper to construct initial default blocks for existing threads
const getInitialBlocksForThread = (thread) => {
  // Find matching note topic if any
  const noteTopic = NOTES.find(n => n.title.toLowerCase() === thread.title.toLowerCase() || n.id === thread.topicId);
  if (noteTopic && TOPIC_NOTES[noteTopic.id] && TOPIC_NOTES[noteTopic.id].length > 0) {
    const rawNotes = TOPIC_NOTES[noteTopic.id];
    return rawNotes.map((n, idx) => ({
      id: `b-${thread.id}-${idx}`,
      type: idx === rawNotes.length - 1 ? 'think' : 'paragraph',
      text: n.body,
      question: idx === rawNotes.length - 1 ? `Key takeaway for ${n.title}?` : undefined,
      hint: idx === rawNotes.length - 1 ? n.preview : undefined,
      answer: idx === rawNotes.length - 1 ? n.body : undefined,
    }));
  }

  return [
    {
      id: `b-${thread.id}-1`,
      type: 'paragraph',
      text: thread.preview || `Learning session for ${thread.title}.`,
    },
  ];
};

// Initial chat sessions seeded from THREADS
const initialSessions = THREADS.map((t, index) => ({
  ...t,
  topicId: t.topicId || (t.id === 't1' ? '1' : t.id),
  subtitle: t.subtitle || (t.title === 'Dynamic Programming' ? 'Memoisation' : t.preview?.split('—')[0]?.trim() || 'Notes'),
  timestamp: Date.now() - (index * 3600 * 1000 * (t.pinned ? 1 : 24)),
  userNotes: [],
  blocks: getInitialBlocksForThread(t),
  bookmarked: t.pinned || false,
  stickyNotes: [],
}));

export const globalState = {
  syllabusHistory: [],
  notesHistory: [],
  testHistory: [],
  assignmentHistory: [],
  deletedChats: [],
  chatSessions: initialSessions,
  currentPlan: 'Free',
  credits: 20,
  examMode: false,
  user: {
    name: USER.name,
    email: USER.email,
    phone: USER.phone,
  },
  theme: 'dark',
};

export const addSyllabus = (item) => { globalState.syllabusHistory.unshift(item); };
export const removeSyllabus = (ids) => { globalState.syllabusHistory = globalState.syllabusHistory.filter(i => !ids.includes(i.id)); };

export const addNotes = (item) => { globalState.notesHistory.unshift(item); };
export const removeNotes = (ids) => { globalState.notesHistory = globalState.notesHistory.filter(i => !ids.includes(i.id)); };

export const addTestResult = (result) => { globalState.testHistory.unshift(result); };

export const addAssignment = (assignment) => { globalState.assignmentHistory.unshift(assignment); };
export const removeAssignment = (ids) => { globalState.assignmentHistory = globalState.assignmentHistory.filter(i => !ids.includes(i.id)); };

export const removeChat = (id) => { 
  if (!globalState.deletedChats.includes(id)) {
    globalState.deletedChats.push(id); 
  }
};

/**
 * Returns all active (non-deleted) chats for a given topicId or topicTitle,
 * ordered from most recent to oldest.
 */
export const getChatsForTopic = (topicId, topicTitle) => {
  const normTitle = topicTitle ? topicTitle.trim().toLowerCase() : '';
  const normId = topicId ? String(topicId).trim().toLowerCase() : '';

  const matching = globalState.chatSessions.filter((chat) => {
    if (globalState.deletedChats.includes(chat.id)) return false;

    // Match by ID / topicId
    if (normId && (
      String(chat.id).toLowerCase() === normId ||
      String(chat.topicId).toLowerCase() === normId
    )) {
      return true;
    }

    // Match by title
    if (normTitle && chat.title) {
      const chatTitleNorm = chat.title.trim().toLowerCase();
      if (chatTitleNorm === normTitle || chatTitleNorm.includes(normTitle) || normTitle.includes(chatTitleNorm)) {
        return true;
      }
    }

    return false;
  });

  // Sort by most recent (highest timestamp or latest updatedAt)
  matching.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return matching;
};

/**
 * Returns the most recent active chat for a topic, or null if none exists.
 */
export const getMostRecentChatForTopic = (topicId, topicTitle) => {
  const chats = getChatsForTopic(topicId, topicTitle);
  return chats.length > 0 ? chats[0] : null;
};

/**
 * Creates and registers a new chat session for a topic.
 */
export const createChatForTopic = ({ topicId, topicTitle, subject, subtitle }) => {
  const matchedNote = NOTES.find(n => 
    (topicId && String(n.id) === String(topicId)) || 
    (topicTitle && n.title.toLowerCase() === topicTitle.toLowerCase())
  );

  const title = topicTitle || matchedNote?.title || 'New Topic';
  const finalSubject = subject || matchedNote?.subject || 'Study';
  const finalSubtitle = subtitle || 'New conversation';

  const newChat = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    topicId: topicId || matchedNote?.id || `top_${Date.now()}`,
    title,
    subject: finalSubject,
    subtitle: finalSubtitle,
    preview: 'New learning session started',
    progress: 0,
    updatedAt: 'Just now',
    timestamp: Date.now(),
    pinned: false,
    userNotes: [],
    blocks: [],
    isNew: true,
    bookmarked: false,
    stickyNotes: [],
  };

  globalState.chatSessions.unshift(newChat);
  return newChat;
};

/**
 * Saves a user note to an existing chat session.
 */
export const saveChatNote = (chatId, note) => {
  const chat = globalState.chatSessions.find(c => c.id === chatId);
  if (chat) {
    if (!chat.userNotes) chat.userNotes = [];
    chat.userNotes.push(note);
    chat.timestamp = Date.now();
    chat.updatedAt = 'Just now';
  }
};

/**
 * Overwrites the sticky notes array for a chat session.
 */
export const saveStickyNotes = (chatId, notes) => {
  const chat = globalState.chatSessions.find(c => c.id === chatId);
  if (chat) {
    chat.stickyNotes = notes;
  }
};

/**
 * Returns the sticky notes array for a chat session.
 */
export const getStickyNotes = (chatId) => {
  const chat = globalState.chatSessions.find(c => c.id === chatId);
  return chat?.stickyNotes || [];
};
