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
let changed = 0;

files.forEach(file => {
  // Skip the theme/context files we'll delete separately
  if (file.includes('ThemeContext') || file.includes('theme.js')) return;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Remove useTheme import lines (various forms)
  content = content.replace(/^import\s*\{[^}]*useTheme[^}]*\}\s*from\s*['"][^'"]+['"];\n?/gm, '');

  // 2. Remove hook call lines (various destructuring forms)
  content = content.replace(/^\s*const\s*\{[^}]*colors[^}]*\}\s*=\s*useTheme\(\);\n?/gm, '');
  
  // 3. Remove const styles = getStyles(colors); lines
  content = content.replace(/^\s*const\s+styles\s*=\s*getStyles\(colors\);\n?/gm, '');

  // 4. Revert getStyles factory back to static StyleSheet.create
  content = content.replace(/const\s+getStyles\s*=\s*\(colors\)\s*=>\s*StyleSheet\.create\(/g, 'const styles = StyleSheet.create(');

  // 5. Replace colors.xyz → Colors.xyz
  content = content.replace(/\bcolors\./g, 'Colors.');

  // 6. Add Colors import if file uses Colors. but doesn't already import it
  if (content.includes('Colors.') && !content.includes("import Colors from")) {
    // Figure out correct relative path based on depth
    const depth = file.split(path.sep).length - 1; // from cwd
    // src is at depth 1, so src/screens is depth 2
    const srcDepth = file.replace(/\\/g, '/').split('/').indexOf('src');
    const fileParts = file.replace(/\\/g, '/').split('/');
    const distFromSrc = fileParts.length - srcDepth - 2; // -2 for 'src' and filename
    const prefix = distFromSrc === 0 ? './' : '../'.repeat(distFromSrc);
    const colorsPath = prefix + 'theme/colors';

    // Insert after last existing import
    const lastImportIdx = [...content.matchAll(/^import .+;/gm)].pop();
    if (lastImportIdx) {
      const insertAt = lastImportIdx.index + lastImportIdx[0].length;
      content = content.slice(0, insertAt) + `\nimport Colors from '${colorsPath}';` + content.slice(insertAt);
    } else {
      content = `import Colors from '${colorsPath}';\n` + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log('Reverted: ' + path.relative('.', file));
  }
});

console.log('\nDone. Reverted ' + changed + ' files.');
