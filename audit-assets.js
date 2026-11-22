const fs = require('fs');
const path = require('path');

// محاولة تحميل sharp لقراءة الأبعاد
let sharp;
try { sharp = require('sharp'); } catch(e) { sharp = null; }

const assetsDir = path.join(__dirname, 'public', 'assets');
const folders = fs.readdirSync(assetsDir)
  .filter(f => fs.statSync(path.join(assetsDir, f)).isDirectory() && !f.startsWith('.'))
  .sort();

console.log('='.repeat(90));
console.log('ASSETS AUDIT REPORT');
console.log('='.repeat(90));
console.log('');

let totalCovers = 0;
let totalChars = 0;
let totalBg = 0;
let totalLogo = 0;
let totalSymbols = 0;
let issues = [];
let wrongNames = [];

folders.forEach(folder => {
  const dir = path.join(assetsDir, folder);
  const files = fs.readdirSync(dir);
  
  const cover = files.find(f => f.toLowerCase() === 'cover.png');
  const character = files.find(f => f.toLowerCase() === 'character.png');
  const bg = files.find(f => f.toLowerCase() === 'bg.jpg' || f.toLowerCase() === 'bg.png');
  const logo = files.find(f => f.toLowerCase() === 'logo.png');
  const symbols = files.filter(f => /^s\d+\.png$/i.test(f));
  
  // كشف الأسماء الخاطئة
  const expectedNames = ['cover.png', 'character.png', 'bg.jpg', 'bg.png', 'logo.png'];
  files.forEach(f => {
    if (f.startsWith('.') || f === 'Thumbs.db') return;
    const lower = f.toLowerCase();
    if (lower === 'cover.png' || lower === 'character.png' || lower === 'bg.jpg' || 
        lower === 'bg.png' || lower === 'logo.png' || /^s\d+\.png$/i.test(lower)) return;
    // اسم غير متوقع
    if (lower.includes('cover') || lower.includes('character') || lower.includes('bg') || 
        lower.includes('logo') || /^s\d+\./.test(lower)) {
      wrongNames.push(`${folder}/${f}  ->  should be: ${f.toLowerCase()}`);
    }
  });
  
  // كشف الامتدادات الخاطئة
  const coverJpg = files.find(f => f.toLowerCase() === 'cover.jpg');
  const charJpg = files.find(f => f.toLowerCase() === 'character.jpg');
  if (coverJpg) issues.push(`${folder}/cover.jpg  ->  rename to cover.png`);
  if (charJpg) issues.push(`${folder}/character.jpg  ->  rename to character.png`);
  
  if (cover) totalCovers++;
  if (character) totalChars++;
  if (bg) totalBg++;
  if (logo) totalLogo++;
  totalSymbols += symbols.length;
  
  const coverStatus = cover ? '✓' : '✗';
  const charStatus = character ? '✓' : '✗';
  
  console.log(`${coverStatus}${charStatus}  ${folder.padEnd(25)}  cover:${cover ? 'OK'.padEnd(4) : 'MISS'.padEnd(4)}  char:${character ? 'OK' : 'MISS'}`);
});

console.log('');
console.log('='.repeat(90));
console.log('SUMMARY');
console.log('='.repeat(90));
console.log(`Folders scanned:    ${folders.length}`);
console.log(`Covers found:       ${totalCovers}/${folders.length}`);
console.log(`Characters found:   ${totalChars}/${folders.length}`);
console.log(`Backgrounds found:  ${totalBg}/${folders.length}`);
console.log(`Logos found:        ${totalLogo}/${folders.length}`);
console.log(`Symbols found:      ${totalSymbols} total`);
console.log('');

if (issues.length > 0) {
  console.log('NAME ISSUES TO FIX:');
  issues.forEach(i => console.log(`  ! ${i}`));
  console.log('');
}

if (wrongNames.length > 0) {
  console.log('UNEXPECTED FILE NAMES:');
  wrongNames.forEach(w => console.log(`  ? ${w}`));
  console.log('');
}

// قائمة المجلدات الناقصة
const missing = folders.filter(folder => {
  const dir = path.join(assetsDir, folder);
  const files = fs.readdirSync(dir);
  return !files.find(f => f.toLowerCase() === 'cover.png') || 
         !files.find(f => f.toLowerCase() === 'character.png');
});

if (missing.length > 0) {
  console.log('FOLDERS MISSING FILES:');
  missing.forEach(m => {
    const dir = path.join(assetsDir, m);
    const files = fs.readdirSync(dir);
    const hasCover = files.find(f => f.toLowerCase() === 'cover.png');
    const hasChar = files.find(f => f.toLowerCase() === 'character.png');
    console.log(`  - ${m}: cover=${hasCover?'OK':'MISS'}, char=${hasChar?'OK':'MISS'}`);
  });
}
