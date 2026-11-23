const fs = require('fs');
const f = 'components/kb2/slots/ClusterEngine.tsx';
const backup = fs.readFileSync(f, 'utf8');
let t = backup;

// 1) import (safe - only if not present)
if (!t.includes('CascadeGrid')) {
  const impA = 'import Sym, { Mascot } from "./Sym";';
  const impB = '\nimport { CascadeGrid } from "@/src/kb3/slots/CascadeGrid";';
  if (t.includes(impA)) t = t.replace(impA, impA + impB);
}

// 2) EXACT match of the board block as seen in real code
const oldBlock = [
'            <div className="k5-board" ref={boardRef}>',
'              {cols.map(function (col, ci) {',
'                return (',
'                  <div key={ci} className="k5-col">',
'                    {col.map(function (k, ri) {',
'                      const idx = ci * ROWS + ri;',
'                      const bomb = bombs.find(function (b) { return b.cell === idx; });',
'                      return (',
'                        <div key={ri} data-cell={idx} className={"k5-cell" + (hits.indexOf(idx) >= 0 ? " hit" : "") + (bomb ? " bomb" : "")}>',
'                          <Sym k={bomb ? 9 : k} size={54}/>',
'                          {bomb && <span className="k5-bombval">{bomb.value}x</span>}',
'                        </div>',
'                      );',
'                    })}',
'                  </div>',
'                );',
'              })}',
'            </div>'
].join('\n');

const newBlock = [
'            <CascadeGrid hits={hits} stepMult={stepMult} turbo={prefs.turbo} accent={cfg.accent}>',
oldBlock,
'            </CascadeGrid>'
].join('\n');

if (t.includes(oldBlock)) {
  t = t.replace(oldBlock, newBlock);
  console.log('EXACT MATCH SUCCESS - board wrapped');
} else {
  console.log('ERROR: exact match failed - aborting safely');
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
console.log('SUCCESS: ClusterEngine wired with CascadeGrid wrapper');
console.log('has import=' + t.includes('import { CascadeGrid }'));
console.log('has wrap=' + t.includes('<CascadeGrid'));
