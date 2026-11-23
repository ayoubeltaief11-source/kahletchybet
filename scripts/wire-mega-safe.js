const fs = require('fs');
const f = 'components/kb2/slots/MegaEngine.tsx';
const backup = fs.readFileSync(f, 'utf8');
let t = backup;

// 1) import
const impA = 'import { REELS, PAY, TIER_OF, megaBySlug } from "@/lib/kb2/megaMath";';
const impB = '\nimport { ReelStrip } from "@/src/kb3/slots/ReelStrip";\nimport type { ReelStripHandle } from "@/src/kb3/slots/ReelStrip";\nimport { sfx } from "@/src/kb3/audio/sfx";';
if (t.includes(impA) && !t.includes('ReelStrip')) t = t.replace(impA, impA + impB);

// 2) refs
const refA = '  const boardRef = useRef<HTMLDivElement>(null);';
const refB = '\n  const reelRefs = useRef<(ReelStripHandle | null)[]>([]);\n  const useStrip = ["dragon-peaks", "ocean-depths", "cosmic-rift"].indexOf(slug) >= 0;';
if (t.includes(refA) && !t.includes('reelRefs')) t = t.replace(refA, refA + refB);

// 3) replace getAudio().reel(); with strip driver
const reelA = '    getAudio().reel();';
const rIdx = t.indexOf(reelA);
if (rIdx >= 0 && !t.includes('sfx.spinStart')) {
  let cutEnd = t.indexOf('\n', rIdx);
  for (let n = 0; n < 8; n++) {
    const nl = t.indexOf('\n', cutEnd + 1);
    if (nl < 0) break;
    const seg = t.substring(cutEnd, nl);
    cutEnd = nl;
    if (seg.includes('window.setTimeout(res, turbo ? 260 : 560)')) break;
  }
  const driver = [
'    if (useStrip) {',
'      sfx.spinStart();',
'      const colsArr = [];',
'      let off = 0;',
'      for (let c = 0; c < heights.length; c++) { colsArr.push(r.grid.slice(off, off + heights[c])); off += heights[c]; }',
'      const anticipate = (r.scatters || []).some(function (idx) { return idx < 8; });',
'      await Promise.all(colsArr.map(function (col, ci) {',
'        const h = reelRefs.current[ci];',
'        if (!h) return Promise.resolve();',
'        return new Promise(function (res) { window.setTimeout(function () { h.spin(col, ci, { turbo: turbo, anticipate: anticipate && ci >= 2 }).then(res); }, ci * (turbo ? 60 : 150)); });',
'      }));',
'      sfx.spinStop();',
'    } else {',
'      getAudio().reel();',
'      const el = boardRef.current;',
'      if (el) { window.requestAnimationFrame(function () { const cells = el.querySelectorAll("[data-m]"); gsap.fromTo(cells, { y: -46, opacity: 0.2 }, { y: 0, opacity: 1, duration: turbo ? 0.22 : 0.44, stagger: { each: 0.012, from: "start" }, ease: "back.out(1.5)" }); }); }',
'      await new Promise(function (res) { window.setTimeout(res, turbo ? 260 : 560); });',
'    }'
  ].join('\n');
  t = t.substring(0, rIdx) + driver + t.substring(cutEnd);
}

// 4) replace cell render block (EXACT match from real code)
const cellOld = '                  <div key={ci} className="k7-reel" style={{ gridTemplateRows: "repeat(" + col.length + ",1fr)" }}>\n                    {col.map(function (k, ri) {\n                      let idx = 0;\n                      for (let i = 0; i < ci; i++) idx += heights[i];\n                      idx += ri;\n                      const on = lit.indexOf(idx) >= 0;\n                      return (\n                        <div key={ri} data-m={idx} className={"k7-cell" + (on ? " lit" : "")}>\n                          <LineSym k={k} set={cfg.set} size={44}/>\n                        </div>\n                      );\n                    })}\n                  </div>';
const cellNew = '                  useStrip ? (\n                    <ReelStrip key={ci} ref={function (h) { reelRefs.current[ci] = h; }} gameId={slug} rows={col.length} initial={col} />\n                  ) : (\n                  <div key={ci} className="k7-reel" style={{ gridTemplateRows: "repeat(" + col.length + ",1fr)" }}>\n                    {col.map(function (k, ri) {\n                      let idx = 0;\n                      for (let i = 0; i < ci; i++) idx += heights[i];\n                      idx += ri;\n                      const on = lit.indexOf(idx) >= 0;\n                      return (\n                        <div key={ri} data-m={idx} className={"k7-cell" + (on ? " lit" : "")}>\n                          <LineSym k={k} set={cfg.set} size={44}/>\n                        </div>\n                      );\n                    })}\n                  </div>\n                  )';
if (t.includes(cellOld)) {
  t = t.replace(cellOld, cellNew);
  console.log('cell render replaced (exact match)');
} else {
  console.log('ERROR: cell render exact match failed - aborting');
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
console.log('MegaEngine wired successfully');
console.log('has spinStart=' + t.includes('sfx.spinStart'));
console.log('has useStrip=' + t.includes('useStrip'));
