const fs = require('fs');

let content = fs.readFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ThreadsScreen.js', 'utf8');

content = content.replace(/import \{ THREADS \} from '\.\.\/data\/mockData';/, `import { THREADS } from '../data/mockData';\nimport { globalState } from '../data/globalState';\nimport { useFocusEffect } from '@react-navigation/native';\nimport { useCallback } from 'react';`);

const oldStateBlock = `  const [query, setQuery]               = useState('');
  const [expandedFolders, setExpanded]  = useState({ DSA: true }); // DSA open by default

  // ── Derived data ────────────────────────────────────────────────────────
  const pinned  = useMemo(() => THREADS.filter((t) => t.pinned), []);
  const folders  = useMemo(() => groupBySubject(THREADS.filter((t) => !t.pinned)), []);

  // Search filters across all threads
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return THREADS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q),
    );
  }, [query]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openThread = (thread) => navigation.navigate('ChatScreen', {
    topicId: thread.id,
    topicTitle: thread.title,
    isNewChat: false,
  });`;

const newStateBlock = `  const [query, setQuery]               = useState('');
  const [expandedFolders, setExpanded]  = useState({ DSA: true }); // DSA open by default
  const [chatSessions, setChatSessions] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setChatSessions(globalState.chatSessions.filter(c => !globalState.deletedChats.includes(c.id)));
    }, [])
  );

  // ── Derived data ────────────────────────────────────────────────────────
  const pinned  = useMemo(() => chatSessions.filter((t) => t.bookmarked || t.pinned), [chatSessions]);
  const folders  = useMemo(() => groupBySubject(chatSessions.filter((t) => !(t.bookmarked || t.pinned))), [chatSessions]);

  // Search filters across all threads
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return chatSessions.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.preview?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q)
    );
  }, [query, chatSessions]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openThread = (thread) => navigation.navigate('ChatScreen', {
    chatId: thread.id,
    topicId: thread.topicId,
    topicTitle: thread.title,
    isNewChat: false,
  });`;

content = content.replace(oldStateBlock, newStateBlock);

// New Chat button also navigates to ChatScreen
content = content.replace(/navigation\.navigate\('ChatScreen', \{ isNew: true, isNewChat: true \}\)/g, "navigation.navigate('ChatScreen', { isNewChat: true })");

fs.writeFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ThreadsScreen.js', content);
console.log('ThreadsScreen patched.');
