const fs = require('fs');
const path = require('path');

const MANGLED_FILES = [
  'src/screens/AssignmentChatScreen.js',
  'src/screens/AssignmentHistoryScreen.js',
  'src/screens/NotesHistoryScreen.js',
  'src/screens/NotesLearningScreen.js',
  'src/screens/QuizScreen.js',
  'src/screens/SyllabusHistoryScreen.js',
  'src/screens/SyllabusScreen.js',
  'src/screens/TestResultDetailScreen.js',
  'src/screens/TopicSelectionScreen.js',
];

let fixed = 0;

MANGLED_FILES.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Pattern: function body opening brace followed by literal \n (the escape sequence written as text)
  // e.g.: export default function Foo({ nav }) {\n  const { colors } = useTheme();\n  const styles = getStyles(colors);
  // The mangled version has actual \n chars (backslash + n) instead of newlines
  
  const before = content;
  
  // Fix pattern 1: `function X(...) {\n  const { colors }` → real newline
  content = content.replace(
    /(\bfunction\s+\w+\s*\([^)]*\)\s*\{)\\n(\s+const \{ colors \} = useTheme\(\);)\\n(\s+const styles = getStyles\(colors\);)/g,
    (_, funcHead, hookLine, styleLine) => `${funcHead}\n${hookLine}\n${styleLine}`
  );

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed: ' + file);
    fixed++;
  } else {
    console.log('Pattern not matched for: ' + file);
    // Show the raw bytes around the suspected line
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('useTheme') && line.includes('\\n')) {
        console.log('  Line ' + (i+1) + ': ' + JSON.stringify(line.substring(0, 120)));
      }
    });
  }
});

console.log('Done. Fixed ' + fixed + ' files.');
