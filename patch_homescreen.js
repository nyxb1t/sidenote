const fs = require('fs');

let content = fs.readFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/HomeScreen.js', 'utf8');

// Remove CURRENT_TOPIC from import
content = content.replace(/import \{ CURRENT_TOPIC, QUICK_ACTIONS, USER \} from '\.\.\/data\/mockData';/, "import { QUICK_ACTIONS, USER } from '../data/mockData';");

// Add recentChat calculation inside HomeScreen component
const hookInjection = `const HomeScreen = ({ navigation }) => {
  const [recentChat, setRecentChat] = useState(() => globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id)));

  useFocusEffect(
    useCallback(() => {
      setHasSyllabusLoc(globalState.syllabusHistory.length > 0);
      setHasNotesLoc(globalState.notesHistory.length > 0);
      setHasAssignmentsLoc(globalState.assignmentHistory.length > 0);
      setRecentChat(globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id)));
    }, [])
  );
`;

content = content.replace(/const HomeScreen = \(\{ navigation \}\) => \{/, "const HomeScreen = ({ navigation }) => {\n  const [recentChat, setRecentChat] = useState(null);");

content = content.replace(/useFocusEffect\(\n\s*useCallback\(\(\) => \{\n\s*setHasSyllabusLoc\(globalState\.syllabusHistory\.length > 0\);\n\s*setHasNotesLoc\(globalState\.notesHistory\.length > 0\);\n\s*setHasAssignmentsLoc\(globalState\.assignmentHistory\.length > 0\);\n\s*\}, \[\]\)\n\s*\);/, `useFocusEffect(
    useCallback(() => {
      setHasSyllabusLoc(globalState.syllabusHistory.length > 0);
      setHasNotesLoc(globalState.notesHistory.length > 0);
      setHasAssignmentsLoc(globalState.assignmentHistory.length > 0);
      setRecentChat(globalState.chatSessions.find(c => !globalState.deletedChats.includes(c.id)));
    }, [])
  );`);

// Replace CURRENT_TOPIC uses with recentChat
content = content.replace(/topicId: CURRENT_TOPIC\.id,/g, "topicId: recentChat?.topicId || recentChat?.id,");
content = content.replace(/topicTitle: CURRENT_TOPIC\.title,/g, "topicTitle: recentChat?.title,");
content = content.replace(/\{CURRENT_TOPIC\.title\}/g, "{recentChat?.title || 'No active chats'}");
content = content.replace(/\{CURRENT_TOPIC\.subtitle\}/g, "{recentChat?.subtitle || 'Start learning'}");
content = content.replace(/CURRENT_TOPIC\.progress/g, "(recentChat?.progress || 0)");

fs.writeFileSync('c:/Users/KIIT/OneDrive/Desktop/Techy/hackathons/sidenote/src/screens/HomeScreen.js', content);
console.log('HomeScreen patched.');
