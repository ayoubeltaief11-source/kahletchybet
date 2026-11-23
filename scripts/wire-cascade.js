const fs = require('fs');
const f = 'components/kb2/slots/ClusterEngine.tsx';
const backup = fs.readFileSync(f, 'utf8');
let t = backup;

// 1) import
const impA = 'import Sym, { Mascot } from "./Sym";';
const impB = '\nimport { CascadeGrid } from "@/src/kb3/slots/CascadeGrid";\nimport { sfx } from "@/src/kb3/audio/sfx";';
if (t.includes(impA) && !t.includes('CascadeGrid')) t = t.replace(impA, impA + impB);

// 2) useStrip flag after cfg line
const cfgA = '  const cfg = slotBySlug(slug);';
const cfgB = '\n  const useStrip = ["candy-cascade", "gemfall-kingdom", "fruit-burst-valley"].indexOf(slug) >= 0;';
if (t.includes(cfgA) && !t.includes('useStrip')) t = t.replace(cfgA, cfgA + cfgB);

// 3) replace getAudio().tumble(); with cascade logic
const tumbleA = '    getAudio().tumble();';
const tIdx = t.indexOf(tumbleA);
if (tIdx >= 0 && !t.includes('sfx.pop')) {
  let cutEnd = t.indexOf('\n', tIdx);
  // skip the next 6 lines (targets + gsap.to + await + setHits + paint + drop)
  for (let n = 0; n < 8; n++) {
    const nl = t.indexOf('\n', cutEnd + 1);
    if (nl < 0) break;
    const seg = t.substring(cutEnd, nl);
    cutEnd = nl;
    if (seg.includes('window.setTimeout(r, prefs.turbo ? 130 : 260)')) break;
  }
  const driver = [
'    if (useStrip) {',
'      sfx.pop(0);',
'      await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 220 : 460); });',
'      setHits([]);',
'      paint(after);',
'      sfx.pop(1);',
'      await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 130 : 260); });',
'    } else {',
'      getAudio().tumble();',
'      const el = boardRef.current;',
'      if (el) {',
'        const targets = cells.map(function (i) { return el.querySelector(\'[data-cell="\' + i + \'"]\'); }).filter(Boolean);',
'        if (targets.length > 0) gsap.to(targets, { scale: 1.18, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" });',
'      }',
'      await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 220 : 460); });',
'      setHits([]);',
'      paint(after);',
'      if (el) {',
'        const drop = cells.map(function (i) { return el.querySelector(\'[data-cell="\' + i + \'"]\'); }).filter(Boolean);',
'        if (drop.length > 0) gsap.fromTo(drop, { y: -34, opacity: 0.2 }, { y: 0, opacity: 1, duration: prefs.turbo ? 0.18 : 0.34, stagger: 0.02, ease: "bounce.out" });',
'      }',
'      await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 130 : 260); });',
'    }'
  ].join('\n');
  t = t.substring(0, tIdx) + driver + t.substring(cutEnd);
}

// 4) wrap board render with conditional
const boardOld = '            <div className="k5-board" ref={boardRef}>\n              {cols.map(function (col, ci) {\n                return (\n                  <div key={ci} className="k5-col">\n                    {col.map(function (k, ri) {\n                      const idx = ci * ROWS + ri;\n                      const bomb = bombs.find(function (b) { return b.cell === idx; });\n                      return (\n                        <div key={ri} data-cell={idx} className={"k5-cell" + (hits.indexOf(idx) >= 0 ? " hit" : "") + (bomb ? " bomb" : "")}>\n                          <Sym k={bomb ? 9 : k} size={54}/>\n                          {bomb && <span className="k5-bombval">{bomb.value}x</span>}\n                        </div>\n                      );\n                    })}\n                  </div>\n                );\n              })}\n            </div>';
const boardNew = '            useStrip ? (\n              <CascadeGrid gameId={slug} grid={grid} hits={hits} stepMult={stepMult} bombs={bombs} cols={COLS} rows={ROWS} turbo={prefs.turbo} />\n            ) : (\n            <div className="k5-board" ref={boardRef}>\n              {cols.map(function (col, ci) {\n                return (\n                  <div key={ci} className="k5-col">\n                    {col.map(function (k, ri) {\n                      const idx = ci * ROWS + ri;\n                      const bomb = bombs.find(function (b) { return b.cell === idx; });\n                      return (\n                        <div key={ri} data-cell={idx} className={"k5-cell" + (hits.indexOf(idx) >= 0 ? " hit" : "") + (bomb ? " bomb" : "")}>\n                          <Sym k={bomb ? 9 : k} size={54}/>\n                          {bomb && <span className="k5-bombval">{bomb.value}x</span>}\n                        </div>\n                      );\n                    })}\n                  </div>\n                );\n              })}\n            </div>\n            )';
if (t.includes(boardOld)) {
  t = t.replace(boardOld, boardNew);
  console.log('board render wrapped (exact match)');
} else {
  console.log('ERROR: board render exact match failed - aborting');
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
console.log('has useStrip=' + t.includes('useStrip'));
console.log('has sfx.pop=' + t.includes('sfx.pop'));
