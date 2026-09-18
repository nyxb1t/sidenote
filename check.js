const fs = require('fs');
const path = require('path');

const walkSync = (dir, fl = []) => {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    fs.statSync(fp).isDirectory() ? walkSync(fp, fl) : f.endsWith('.js') && fl.push(fp);
  });
  return fl;
};

const files = walkSync('src');
let issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative('src', file);

  // Check 1: getStyles called but not defined in file
  if (content.includes('const styles = getStyles(colors)') && !content.includes('const getStyles =') && !content.includes('getStyles = (')) {
    issues.push('[MISSING getStyles def] ' + relFile);
  }

  // Check 2: useTheme import path check
  const importMatch = content.match(/import\s*\{[^}]*useTheme[^}]*\}\s*from\s*['"]([^'"]+)['"]/);
  if (importMatch) {
    const importPath = importMatch[1];
    const fileDir = path.dirname(file);
    let resolved = path.resolve(fileDir, importPath);
    if (!resolved.endsWith('.js')) resolved += '.js';
    if (!fs.existsSync(resolved)) {
      issues.push('[BAD IMPORT PATH: ' + importPath + '] ' + relFile);
    }
  }

  // Check 3: literal backslash-n (mangled injection)
  if (content.includes('\\n  const { colors }') || content.includes('useTheme();\\n')) {
    issues.push('[MANGLED INJECTION] ' + relFile);
  }
});

if (issues.length === 0) {
  console.log('All checks passed!');
} else {
  console.log(issues.length + ' issue(s) found:');
  issues.forEach(i => console.log('  ' + i));
}
