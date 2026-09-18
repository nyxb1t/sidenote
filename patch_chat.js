const fs = require('fs');
let code = fs.readFileSync('src/screens/ChatScreen.js', 'utf8');

// Add imports
code = code.replace(
  /import \{ globalState, getMostRecentChatForTopic, createChatForTopic, saveChatNote \} from '\.\.\/data\/globalState';/,
  "import { globalState, getMostRecentChatForTopic, createChatForTopic, saveChatNote, setChatSessionBookmarked } from '../data/globalState';\nimport { generateNotes, generateRetryExplanation, trackLearnerEvent } from '../services/aiService';"
);

// Update PANEL_ACTIONS
code = code.replace(
  /\{ id: 'note',\s*icon: 'create-outline',\s*label: 'Sticky\\\\nnote'\s*\}/,
  "{ id: 'notes', icon: 'document-text-outline', label: 'Generate\\\\nNotes' }"
);

const oldHandle = code.substring(code.indexOf('const handlePanelAction = (id) => {'), code.indexOf('const removeStickyNote = (id) => {'));

const newHandle = \const handlePanelAction = (id) => {
    collapsePanel();
    if (id === 'notes') {
      const fetchNotes = async () => {
        try {
          const result = await generateNotes(route.params.topicId);
          const note = result.data || result;
          note.updatedAt = new Date().toLocaleDateString();
          note.title = note.topic || chatSession?.title || 'Notes';
          navigation.navigate('NotesStack', {
            screen: 'NoteDetailScreen',
            params: { note: note, topic: { title: note.title } }
          });
        } catch (err) {
          alert(err.message || 'Error generating notes');
        }
      };
      fetchNotes();
    } else if (id === 'visual') {
      setMessages(prev => [
        ...prev,
        { id: 'visual-' + Date.now(), type: 'visual', timestamp: Date.now() },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } else if (id === 'practice') {
      navigation.navigate('HomeStack', { screen: 'QuizScreen', params: { topic: chatSession?.title, lesson_id: route.params.topicId } });
    } else if (id === 'examples') {
      setMessages(prev => [
        ...prev,
        {
          id: 'b-ex-' + Date.now(),
          type: 'block',
          timestamp: Date.now(),
          block: {
            id: 'b-ex-' + Date.now(),
            type: 'think',
            question: 'Example: Fibonacci sequence',
            hint: 'Another classical use case for DP.',
            answer: 'fib(n) = fib(n-1) + fib(n-2). Instead of recomputing, store the values in an array.',
          },
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } else if (id === 'retry') {
      const fetchRetry = async () => {
        try {
          setMessages(prev => [...prev, { id: 'retry-loading', type: 'block', timestamp: Date.now(), block: { id: 'r-load', type: 'paragraph', text: 'Thinking of a different way to explain...' } }]);
          
          const previous_strategy = chatSession?.teachingStrategy || 'step-by-step';
          const topicStr = chatSession?.title || 'this topic';
          const result = await generateRetryExplanation(topicStr, previous_strategy);
          const retryObj = result.data || result;
          
          await trackLearnerEvent({
            type: 'retry_requested',
            topic: topicStr,
            strategyUsed: retryObj.strategy || previous_strategy
          });
          
          setMessages(prev => {
            const withoutLoading = prev.filter(m => m.id !== 'retry-loading');
            if (retryObj.content && Array.isArray(retryObj.content)) {
              return [...withoutLoading, ...retryObj.content];
            } else if (retryObj.explanation) {
              return [...withoutLoading, { id: 'retry-' + Date.now(), type: 'block', timestamp: Date.now(), block: { id: 'r-' + Date.now(), type: 'paragraph', text: retryObj.explanation } }];
            }
            return withoutLoading;
          });
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
        } catch (err) {
          alert(err.message || 'Error fetching explanation');
          setMessages(prev => prev.filter(m => m.id !== 'retry-loading'));
        }
      };
      fetchRetry();
    }
  };

  \;

code = code.replace(oldHandle, newHandle);
fs.writeFileSync('src/screens/ChatScreen.js', code);
