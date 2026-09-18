const fs = require('fs');

let content = fs.readFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ChatScreen.js', 'utf8');

const oldEffect = `  const { topicId, topicTitle, isNewChat, isNew: routeIsNew } = route?.params || {};

  // Resolve or create chat session
  const [chatSession, setChatSession] = useState(() => {
    if (routeIsNew || isNewChat) return createChatForTopic({ topicId, topicTitle });
    if (topicId || topicTitle) {
      const existing = getMostRecentChatForTopic(topicId, topicTitle);
      if (existing) return existing;
      return createChatForTopic({ topicId, topicTitle });
    }
    return createChatForTopic({ topicId: 'new', topicTitle: 'New Topic', subject: 'Study', subtitle: 'New conversation' });
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

const newEffect = `  const { chatId, topicId, topicTitle, isNewChat, isNew: routeIsNew } = route?.params || {};

  // Resolve or create chat session
  const [chatSession, setChatSession] = useState(() => {
    if (chatId) {
      const exact = globalState.chatSessions.find(c => c.id === chatId);
      if (exact) return exact;
    }
    if (routeIsNew || isNewChat) return createChatForTopic({ topicId, topicTitle });
    if (topicId || topicTitle) {
      const existing = getMostRecentChatForTopic(topicId, topicTitle);
      if (existing) return existing;
      return createChatForTopic({ topicId, topicTitle });
    }
    return createChatForTopic({ topicId: 'new', topicTitle: 'New Topic', subject: 'Study', subtitle: 'New conversation' });
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
      setUserNotes(session.userNotes || []);
      setMockContentBlocks(session.blocks || []);
      setBookmarked(session.bookmarked || false);
    }
  }, [chatId, topicId, topicTitle, isNewChat, routeIsNew]);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/ChatScreen.js', content);
console.log('ChatScreen patched for chatId support.');
