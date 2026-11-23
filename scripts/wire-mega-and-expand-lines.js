const fs = require('fs');

// ===== 1) LineEngine: expand useStrip to ALL lines games =====
const lf = 'components/kb2/slots/LineEngine.tsx';
let lt = fs.readFileSync(lf, 'utf8');
const oldUse = '  const useStrip = slug === "neon-cherry-rush";';
const newUse = '  const useStrip = ["neon-cherry-rush", "electric-lemon", "plasma-bell"].indexOf(slug) >= 0;';
if (lt.includes(oldUse)) {
  lt = lt.replace(oldUse, newUse);
  fs.writeFileSync(lf, lt, 'utf8');
  console.log('LineEngine: useStrip expanded to all 3 lines');
} else if (lt.includes(newUse)) {
  console.log('LineEngine: already expanded');
} else {
  console.log('WARN LineEngine: useStrip anchor not found');
}

// ===== 2) MegaEngine: import + refs + motion + render =====
const mf = 'components/kb2/slots/MegaEngine.tsx';
let mt = fs.readFileSync(mf, 'utf8');
const mbefore = mt;

// 2a) import after megaMath import
const mImpAnchor = 'import { REELS, PAY, TIER_OF, megaBySlug } from "@/lib/kb2/megaMath";';
const mImpAdd = '\nimport { ReelStrip } from "@/src/kb3/slots/ReelStrip";\nimport type { ReelStripHandle } from "@/src/kb3/slots/ReelStrip";\nimport { sfx } from "@/src/kb3/audio/sfx";';
if (mt.includes(mImpAnchor) && !mt.includes('ReelStrip')) {
  mt = mt.replace(mImpAnchor, mImpAnchor + mImpAdd);
}

// 2b) refs after boardRef
const mRefAnchor = '  const boardRef = useRef<HTMLDivElement>(null);';
const mRefAdd = '\n  const reelRefs = useRef<(ReelStripHandle | null)[]>([]);\n  const useStrip = ["dragon-peaks", "ocean-depths", "cosmic-rift"].indexOf(slug) >= 0;';
if (mt.includes(mRefAnchor) && !mt.includes('reelRefs')) {
  mt = mt.replace(mRefAnchor, mRefAnchor + mRefAdd);
}

// 2c) replace unique getAudio().reel(); line with strip driver
const mReelAnchor = '    getAudio().reel();';
const mReelIdx = mt.indexOf(mReelAnchor);
if (mReelIdx >= 0 && !mt.includes('sfx.spinStart')) {
  const afterReel = mt.indexOf('\n', mReelIdx);
  // find the end of the following gsap block + wait (next 4 lines)
  let cutEnd = afterReel;
  for (let n = 0; n < 6; n++) {
    const nl = mt.indexOf('\n', cutEnd + 1);
    if (nl < 0) break;
    const seg = mt.substring(cutEnd, nl);
    cutEnd = nl;
    if (seg.includes('window.setTimeout(res, turbo ? 260 : 560)')) break;
  }
  const driver = [
'    if (useStrip) {',
'      sfx.spinStart();',
'      const colsArr = heights.map(function (h, ci) { const s = (() => { let o = 0; for (let i = 0; i < ci; i++) o += heights[i]; return o; })(); return r.grid.slice(s, s + h); });',
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
  mt = mt.substring(0, mReelIdx) + driver + mt.substring(cutEnd);
}

// 2d) replace reel cell render with conditional strip
const mCellOld = '                  <div key={ci} className={"k7-reel" + (expand === ci ? " expanding" : "")} style={{ height: col.length * 64 }}>\n                    {col.map(function (k, ri) {\n                      let idx = 0;\n                      for (let i = 0; i < ci; i++) idx += heights[i];\n                      idx += ri;\n                      const on = lit.indexOf(idx) >= 0;\n                      return (\n                        <div key={ri} data-m={idx} className={"k7-cell" + (on ? " lit" : "")}>\n                          <LineSym k={k} set={cfg.set} size={44}/>\n                        </div>\n                      );\n                    })}\n                  </div>';
const mCellNew = '                  useStrip ? (\n                    <ReelStrip key={ci} ref={function (h) { reelRefs.current[ci] = h; }} gameId={slug} rows={col.length} initial={col} />\n                  ) : (\n                  <div key={ci} className={"k7-reel" + (expand === ci ? " expanding" : "")} style={{ height: col.length * 64 }}>\n                    {col.map(function (k, ri) {\n                      let idx = 0;\n                      for (let i = 0; i < ci; i++) idx += heights[i];\n                      idx += ri;\n                      const on = lit.indexOf(idx) >= 0;\n                      return (\n                        <div key={ri} data-m={idx} className={"k7-cell" + (on ? " lit" : "")}>\n                          <LineSym k={k} set={cfg.set} size={44}/>\n                        </div>\n                      );\n                    })}\n                  </div>\n                  )';
if (mt.includes(mCellOld)) {
  mt = mt.replace(mCellOld, mCellNew);
  console.log('MegaEngine: cell render replaced');
} else {
  console.log('WARN MegaEngine: cell render anchor not matched - trying flexible');
  // flexible: find the k7-reel div block and wrap it
  const flexAnchor = '<div key={ci} className={"k7-reel"';
  const fIdx = mt.indexOf(flexAnchor);
  if (fIdx >= 0 && !mt.includes('useStrip ? (')) {
    // find matching closing </div> for this reel (count divs)
    let depth = 0, i = fIdx, end = -1;
    for (; i < mt.length; i++) {
      if (mt.substr(i, 4) === '<div') { depth++; }
      else if (mt.substr(i, 6) === '</div>') { depth--; if (depth === 0) { end = i + 6; break; } }
    }
    if (end > 0) {
      const block = mt.substring(fIdx, end);
      mt = mt.substring(0, fIdx) + 'useStrip ? (\n                    <ReelStrip key={ci} ref={function (h) { reelRefs.current[ci] = h; }} gameId={slug} rows={col.length} initial={col} />\n                  ) : (\n                  ' + block + '\n                  )' + mt.substring(end);
      console.log('MegaEngine: cell render replaced via flexible match');
    }
  }
}

fs.writeFileSync(mf, mt, 'utf8');
const mafter = fs.readFileSync(mf, 'utf8');
console.log('MegaEngine changed=' + (mafter !== mbefore));
console.log('has ReelStrip import=' + mafter.includes('import { ReelStrip }'));
console.log('has reelRefs=' + mafter.includes('reelRefs'));
console.log('has spinStart=' + mafter.includes('sfx.spinStart'));
console.log('has useStrip=' + mafter.includes('useStrip'));
console.log('braces balanced=' + ((mafter.match(/\{/g)||[]).length === (mafter.match(/\}/g)||[]).length));
console.log('parens balanced=' + ((mafter.match(/\(/g)||[]).length === (mafter.match(/\)/g)||[]).length));

// ===== verify LineEngine too =====
const lafter = fs.readFileSync(lf, 'utf8');
console.log('LineEngine has all-lines useStrip=' + lafter.includes('electric-lemon', 'plasma-bell'));
console.log('LineEngine braces balanced=' + ((lafter.match(/\{/g)||[]).length === (lafter.match(/\}/g)||[]).length));
