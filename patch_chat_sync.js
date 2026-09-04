const fs = require('fs');

let content = fs.readFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ChatScreen.js', 'utf8');

const oldState = `  // Resolve or create chat session
  const [chatSession] = useState(() => {
    if (routeIsNew || isNewChat) {
      return createChatForTopic({ topicId, topicTitle });
    }
    if (topicId || topicTitle) {
      const existing = getMostRecentChatForTopic(topicId, topicTitle);
      if (existing) return existing;
      return createChatForTopic({ topicId, topicTitle });
    }
    const fallback = globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id));
    return fallback || createChatForTopic({
      topicId: 't1',
      topicTitle: 'New Topic',
      subject: 'Study',
      subtitle: 'New conversation',
    });
  });

  const insets           = useSafeAreaInsets();
  const scrollRef        = useRef(null);
  const [inputText, setInputText]   = useState('');
  const [bookmarked, setBookmarked] = useState(chatSession?.bookmarked || false);
  const [panelOpen, setPanelOpen]   = useState(false);
  const [userNotes, setUserNotes]   = useState(chatSession?.userNotes || []);
  
  const [stickyNotes, setStickyNotes] = useState([]);
  const [showVisualMock, setShowVisualMock] = useState(false);
  const [showPracticeMock, setShowPracticeMock] = useState(false);
    const [mockContentBlocks, setMockContentBlocks] = useState(
    chatSession?.blocks && chatSession.blocks.length > 0
      ? chatSession.blocks
      : []
  );`;

const newState = `  // Resolve or create chat session
  const [chatSession, setChatSession] = useState(() => {
    if (routeIsNew || isNewChat) return createChatForTopic({ topicId, topicTitle });
    if (topicId || topicTitle) {
      const existing = getMostRecentChatForTopic(topicId, topicTitle);
      if (existing) return existing;
      return createChatForTopic({ topicId, topicTitle });
    }
    const fallback = globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id));
    return fallback || createChatForTopic({ topicId: 't1', topicTitle: 'New Topic', subject: 'Study', subtitle: 'New conversation' });
  });

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [bookmarked, setBookmarked] = useState(chatSession?.bookmarked || false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [userNotes, setUserNotes] = useState(chatSession?.userNotes || []);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [showVisualMock, setShowVisualMock] = useState(false);
  const [showPracticeMock, setShowPracticeMock] = useState(false);
  const [mockContentBlocks, setMockContentBlocks] = useState(chatSession?.blocks || []);

  useEffect(() => {
    if (topicId || topicTitle) {
      let session;
      if (routeIsNew || isNewChat) {
        session = createChatForTopic({ topicId, topicTitle });
      } else {
        session = getMostRecentChatForTopic(topicId, topicTitle);
        if (!session) session = createChatForTopic({ topicId, topicTitle });
      }
      setChatSession(session);
      setUserNotes(session.userNotes || []);
      setMockContentBlocks(session.blocks || []);
      setBookmarked(session.bookmarked || false);
    }
  }, [topicId, topicTitle, isNewChat, routeIsNew]);`;

content = content.replace(oldState, newState);

// add useEffect import if missing
if (!content.includes('useEffect')) {
  content = content.replace(/import React, \{ useState, useCallback, useRef \} from 'react';/, "import React, { useState, useCallback, useRef, useEffect } from 'react';");
}

fs.writeFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ChatScreen.js', content);
console.log('ChatScreen patched.');
