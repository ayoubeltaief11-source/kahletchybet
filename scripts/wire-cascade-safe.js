const fs = require('fs');
const f = 'components/kb2/slots/ClusterEngine.tsx';
const backup = fs.readFileSync(f, 'utf8');
let t = backup;

// 1) import
const impA = 'import Sym, { Mascot } from "./Sym";';
const impB = '\nimport { CascadeGrid } from "@/src/kb3/slots/CascadeGrid";';
if (t.includes(impA) && !t.includes('CascadeGrid')) t = t.replace(impA, impA + impB);

// 2) wrap k5-board with CascadeGrid (single line replacement)
const boardStart = '            <div className="k5-board" ref={boardRef}>';
const boardEnd = '            </div>\n            {stepMult > 0 && <div className="k5-stepwin">+{stepMult.toFixed(2)}x</div>}';
const bStartIdx = t.indexOf(boardStart);
const bEndIdx = t.indexOf(boardEnd, bStartIdx);

if (bStartIdx >= 0 && bEndIdx > bStartIdx && !t.includes('CascadeGrid')) {
  const boardBlock = t.substring(bStartIdx, bEndIdx + boardEnd.length);
  const wrapped = '            <CascadeGrid hits={hits} stepMult={stepMult} turbo={prefs.turbo} accent={cfg.accent}>\n' + boardBlock + '\n            </CascadeGrid>';
  t = t.substring(0, bStartIdx) + wrapped + t.substring(bEndIdx + boardEnd.length);
  console.log('k5-board wrapped with CascadeGrid');
} else if (t.includes('CascadeGrid')) {
  console.log('already wrapped');
} else {
  console.log('ERROR: board block not found - aborting');
  fs.writeFileSync(f, backup, 'utf8');
  console.log('restored from backup');
  process.exit(1);
}

// verify braces before writing
const ob = (t.match(/\{/g) || []).length;
const cb = (t.match(/\}/g) || []).length;
const op = (t.match(/\(/g) || []).length;
const cp = (t.match(/\)/g) || []).length;
console.log('braces=' + ob + '/' + cb + ' balanced=' + (ob === cb));
console.log('parens=' + op + '/' + cp + ' balanced=' + (op === cp));
if (ob !== cb || op !== cp) {
  console.log('ERROR: unbalanced - restoring from backup');
  fs.writeFileSync(f, backup, 'utf8');
  process.exit(1);
}
fs.writeFileSync(f, t, 'utf8');
console.log('ClusterEngine wired successfully');
console.log('has CascadeGrid import=' + t.includes('import { CascadeGrid }'));
console.log('has CascadeGrid wrap=' + t.includes('<CascadeGrid'));
