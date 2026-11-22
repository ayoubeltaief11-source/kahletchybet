const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'kb2', 'games.json'), 'utf8'));
const GROUPS = {
  cluster: ['components/kb2/slots/ClusterEngine.tsx', 'components/kb2/slots/Sym.tsx'],
  lines: ['components/kb2/slots/LineEngine.tsx', 'components/kb2/slots/LineSym.tsx'],
  megaways: ['components/kb2/slots/MegaEngine.tsx', 'components/kb2/slots/LineSym.tsx'],
  hold: ['components/kb2/slots/HoldEngine.tsx'],
  crash: ['components/kb2/crash/Stage.tsx'],
  roulette: ['src/kb3/roulette/RoulettePro.tsx']
};
function readAll(files) {
  let s = '';
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) s += fs.readFileSync(p, 'utf8') + '\n';
  }
  return s;
}
console.log('slug'.padEnd(22) + 'eng'.padEnd(12) + 'sym char bg  note');
console.log('-'.repeat(72));
const broken = [];
for (const game of g.games) {
  const eng = game.engine || game.type || game.craft || '';
  let files = null;
  if (game.family === 'crash') files = GROUPS.crash;
  else if (game.family === 'roulette') files = GROUPS.roulette;
  else if (game.family === 'slots') files = GROUPS[eng] || GROUPS.cluster;
  if (game.family === 'instant') {
    console.log(game.slug.padEnd(22) + (eng || '-').padEnd(12) + '?    ?    ?    instant engine unknown - need Get-Content');
    broken.push(game.slug);
    continue;
  }
  const src = readAll(files);
  const sym = src.includes('/assets/packs') || src.includes('symbolUrl');
  const chr = src.includes('character.png') || src.includes('GameCharacter');
  const bg = src.includes('bg.jpg');
  const needSym = game.family === 'slots';
  const okSym = needSym ? sym : true;
  if (!okSym || !chr || !bg) broken.push(game.slug);
  const note = !okSym ? 'symbols NOT linked' : (!chr ? 'character NOT linked' : (!bg ? 'bg NOT linked' : 'ok'));
  console.log(game.slug.padEnd(22) + (eng || '-').padEnd(12) + (sym ? 'YES' : 'NO ').padEnd(5) + (chr ? 'YES' : 'NO ').padEnd(5) + (bg ? 'YES' : 'NO ') + '  ' + note);
}
console.log('-'.repeat(72));
console.log('Truly broken: ' + broken.length + ' -> ' + broken.join(', '));
