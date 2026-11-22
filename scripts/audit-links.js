const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lib', 'kb2', 'games.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');

function engineFile(game) {
  const fam = game.family;
  const eng = game.engine || game.type || game.craft || '';
  if (fam === 'slots') {
    if (eng === 'cluster') return 'components/kb2/slots/ClusterEngine.tsx';
    if (eng === 'lines') return 'components/kb2/slots/LineEngine.tsx';
    if (eng === 'megaways') return 'components/kb2/slots/MegaEngine.tsx';
    if (eng === 'holdwin' || eng === 'holdwin5' || eng === 'hold') return 'components/kb2/slots/HoldEngine.tsx';
    return 'components/kb2/slots/ClusterEngine.tsx';
  }
  if (fam === 'crash') return 'components/kb2/crash/Stage.tsx';
  if (fam === 'roulette') return 'src/kb3/roulette/RoulettePro.tsx';
  if (fam === 'instant') return 'UNKNOWN_INSTANT';
  return 'UNKNOWN';
}

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

console.log('slug'.padEnd(22) + 'engine'.padEnd(16) + 'sym? char? bg?  note');
console.log('-'.repeat(80));
let broken = 0;
for (const game of g.games) {
  const rel = engineFile(game);
  const src = rel === 'UNKNOWN_INSTANT' || rel === 'UNKNOWN' ? null : read(rel);
  if (src === null) {
    const note = rel === 'UNKNOWN_INSTANT' ? 'instant engine file unknown - need Get-Content' : 'engine file missing: ' + rel;
    console.log(game.slug.padEnd(22) + (game.engine || '-').padEnd(16) + '?    ?     ?    ' + note);
    broken++;
    continue;
  }
  const sym = src.includes('/assets/packs') || src.includes('symbolUrl') || src.includes('gameAssets');
  const chr = src.includes('character.png') || src.includes('GameCharacter');
  const bg = src.includes('bg.jpg');
  if (!sym || !chr || !bg) broken++;
  console.log(game.slug.padEnd(22) + (game.engine || '-').padEnd(16) + (sym ? 'YES ' : 'NO  ') + ' ' + (chr ? 'YES ' : 'NO  ') + ' ' + (bg ? 'YES' : 'NO ') + '  ' + (!sym ? 'symbols NOT linked' : (!chr ? 'character NOT linked' : (!bg ? 'bg NOT linked' : 'ok'))));
}
console.log('-'.repeat(80));
console.log('Games needing work: ' + broken + ' / ' + g.games.length);
