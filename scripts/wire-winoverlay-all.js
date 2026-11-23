const fs = require('fs');

const engines = [
  { file: 'components/kb2/slots/LineEngine.tsx', prefix: 'k6', frameClass: 'k6-frame', boardClass: 'k6-board' },
  { file: 'components/kb2/slots/MegaEngine.tsx', prefix: 'k7', frameClass: 'k7-frame', boardClass: 'k7-board' },
  { file: 'components/kb2/slots/ClusterEngine.tsx', prefix: 'k5', frameClass: 'k5-frame', boardClass: 'k5-board' },
  { file: 'components/kb2/slots/HoldEngine.tsx', prefix: 'k9', frameClass: 'k9-frame', boardClass: 'k9-grid' }
];

for (const eng of engines) {
  const f = eng.file;
  const backup = fs.readFileSync(f, 'utf8');
  let t = backup;

  // import
  if (!t.includes('WinOverlay')) {
    const impA = 'import { usePrefs } from "@/lib/kb/prefs";';
    const impB = '\nimport { WinOverlay } from "@/src/kb3/slots/WinOverlay";';
    if (t.includes(impA)) t = t.replace(impA, impA + impB);
  }

  // find the frame opening tag and its matching close
  const openTag = '<div className="' + eng.frameClass + '"';
  const oIdx = t.indexOf(openTag);
  if (oIdx < 0) { console.log('SKIP ' + f + ': frame not found'); continue; }

  // find closing </div> by counting depth
  let depth = 0, endIdx = -1;
  for (let i = oIdx; i < t.length; i++) {
    if (t.substr(i, 4) === '<div') depth++;
    else if (t.substr(i, 6) === '</div>') { depth--; if (depth === 0) { endIdx = i + 6; break; } }
  }
  if (endIdx < 0) { console.log('SKIP ' + f + ': no matching close'); continue; }

  const block = t.substring(oIdx, endIdx);
  const wrapped = '<WinOverlay win={win} accent={cfg.accent} onDismiss={function(){setWin(null)}}>\n' + block + '\n</WinOverlay>';
  t = t.substring(0, oIdx) + wrapped + t.substring(endIdx);

  // verify braces
  const ob = (t.match(/\{/g) || []).length;
  const cb = (t.match(/\}/g) || []).length;
  const op = (t.match(/\(/g) || []).length;
  const cp = (t.match(/\)/g) || []).length;
  if (ob !== cb || op !== cp) {
    console.log('ERROR ' + f + ': unbalanced (' + ob+'/'+cb+' '+op+'/'+cp+') - restoring');
    fs.writeFileSync(f, backup, 'utf8');
    continue;
  }
  fs.writeFileSync(f, t, 'utf8');
  console.log('OK ' + f + ': WinOverlay wired');
}
