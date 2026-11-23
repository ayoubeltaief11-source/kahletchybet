const fs = require('fs');
const f = 'components/kb2/slots/HoldEngine.tsx';
const backup = fs.readFileSync(f, 'utf8');
let t = backup;

if (!t.includes('HoldWin')) {
  const impA = 'import { getGame, sym, asset } from "@/src/kb3/registry";';
  const impB = '\nimport { HoldWin } from "@/src/kb3/slots/HoldWin";';
  if (t.includes(impA)) t = t.replace(impA, impA + impB);
}

// wrap k9-grid with HoldWin
const gridOpen = '<div className="k9-grid" ref={boardRef} style={{ gridTemplateColumns: "repeat(" + COLS + ",1fr)" }}>';
const gIdx = t.indexOf(gridOpen);
if (gIdx >= 0 && !t.includes('<HoldWin')) {
  let depth = 0, endIdx = -1;
  for (let i = gIdx; i < t.length; i++) {
    if (t.substr(i, 4) === '<div') depth++;
    else if (t.substr(i, 6) === '</div>') { depth--; if (depth === 0) { endIdx = i + 6; break; } }
  }
  if (endIdx > 0) {
    const block = t.substring(gIdx, endIdx);
    const wrapped = '<HoldWin board={board} fresh={fresh} respins={respins} filled={filled} totalCells={CELLS} jackpotHit={lastJp} grandFull={filled>=CELLS} accent={rec.color}>\n' + block + '\n</HoldWin>';
    t = t.substring(0, gIdx) + wrapped + t.substring(endIdx);
    console.log('HoldWin wrapped around k9-grid');
  } else {
    console.log('ERROR: no matching close for k9-grid');
    fs.writeFileSync(f, backup, 'utf8');
    process.exit(1);
  }
} else if (t.includes('<HoldWin')) {
  console.log('already wrapped');
} else {
  console.log('ERROR: k9-grid open not found');
  fs.writeFileSync(f, backup, 'utf8');
  process.exit(1);
}

const ob = (t.match(/\{/g) || []).length;
const cb = (t.match(/\}/g) || []).length;
console.log('braces=' + ob + '/' + cb + ' balanced=' + (ob === cb));
if (ob !== cb) {
  console.log('ERROR: unbalanced - restoring');
  fs.writeFileSync(f, backup, 'utf8');
  process.exit(1);
}
fs.writeFileSync(f, t, 'utf8');
console.log('SUCCESS: HoldEngine wired with HoldWin');
