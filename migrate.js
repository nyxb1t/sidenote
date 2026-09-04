const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.js')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('src');
let changed = 0;

files.forEach(file => {
  if (file.includes('context') || file.includes('theme')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Colors')) return;

  const importRegex = /import\s+Colors\s+from\s+['"]([^'"]+)['"];?/g;
  let hasImport = false;
  let relPath = '../context/ThemeContext';
  content = content.replace(importRegex, (match, p1) => {
    hasImport = true;
    if (p1.includes('../../')) {
      relPath = '../../context/ThemeContext';
    }
    return `import { useTheme } from '${relPath}';`;
  });

  if (!hasImport) return;

  content = content.replace(/Colors\./g, 'colors.');

  const styleRegex = /const\s+styles\s*=\s*StyleSheet\.create\(/;
  const hasStyles = styleRegex.test(content);
  if (hasStyles) {
    content = content.replace(styleRegex, 'const getStyles = (colors) => StyleSheet.create(');
  }

  // Inject hook into components (matches Capitalized const functions)
  const compRegex = /const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*\{/g;
  
  content = content.replace(compRegex, (match) => {
    let injection = `\n  const { colors } = useTheme();`;
    if (hasStyles) {
      injection += `\n  const styles = getStyles(colors);`;
    }
    return `${match}${injection}`;
  });
  
  fs.writeFileSync(file, content, 'utf8');
  changed++;
});

console.log('Modified files:', changed);
