const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'public', 'assets');
const folders = fs.readdirSync(assetsDir)
  .filter(f => fs.statSync(path.join(assetsDir, f)).isDirectory() && f !== 'packs')
  .sort();

const packsDir = path.join(assetsDir, 'packs');
const packs = fs.readdirSync(packsDir)
  .filter(f => fs.statSync(path.join(packsDir, f)).isDirectory())
  .sort();

console.log('='.repeat(100));
console.log('FINAL ASSETS AUDIT');
console.log('='.repeat(100));
console.log('');

// فحص الألعاب
let totalCovers = 0, totalChars = 0, totalBg = 0, totalLogo = 0;
let missing = [];

folders.forEach(folder => {
  const dir = path.join(assetsDir, folder);
  const files = fs.readdirSync(dir).map(f => f.toLowerCase());
  
  const hasCover = files.includes('cover.png');
  const hasChar = files.includes('character.png');
  const hasBg = files.includes('bg.jpg') || files.includes('bg.png');
  const hasLogo = files.includes('logo.png');
  
  if (hasCover) totalCovers++;
  if (hasChar) totalChars++;
  if (hasBg) totalBg++;
  if (hasLogo) totalLogo++;
  
  const status = (hasCover ? '✓' : '✗') + (hasChar ? '✓' : '✗') + (hasBg ? '✓' : '✗') + (hasLogo ? '✓' : '✗');
  const missingItems = [];
  if (!hasCover) missingItems.push('cover');
  if (!hasChar) missingItems.push('char');
  if (!hasBg) missingItems.push('bg');
  if (!hasLogo) missingItems.push('logo');
  
  if (missingItems.length > 0) {
    missing.push({ folder, items: missingItems });
  }
  
  console.log(`${status}  ${folder.padEnd(25)}`);
});

console.log('');
console.log('='.repeat(100));
console.log('PACKS AUDIT');
console.log('='.repeat(100));
console.log('');

let totalSymbols = 0;
packs.forEach(pack => {
  const dir = path.join(packsDir, pack);
  const files = fs.readdirSync(dir).filter(f => /^s\d+\.png$/i.test(f)).sort();
  totalSymbols += files.length;
  console.log(`📦 ${pack.padEnd(15)} ${files.length}/9 symbols: ${files.map(f => f.replace('.png','')).join(', ')}`);
});

console.log('');
console.log('='.repeat(100));
console.log('SUMMARY');
console.log('='.repeat(100));
console.log(`Games:          ${folders.length}`);
console.log(`Covers:         ${totalCovers}/${folders.length}`);
console.log(`Characters:     ${totalChars}/${folders.length}`);
console.log(`Backgrounds:    ${totalBg}/${folders.length}`);
console.log(`Logos:          ${totalLogo}/${folders.length}`);
console.log(`Symbol packs:   ${packs.length}`);
console.log(`Total symbols:  ${totalSymbols}/54`);
console.log('');

if (missing.length > 0) {
  console.log('⚠ MISSING FILES:');
  missing.forEach(m => console.log(`  - ${m.folder}: missing ${m.items.join(', ')}`));
} else {
  console.log('✅ ALL ASSETS COMPLETE!');
}
