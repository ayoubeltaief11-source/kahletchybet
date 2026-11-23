const fs = require('fs');
const f = 'components/kb2/slots/LineEngine.tsx';
let t = fs.readFileSync(f, 'utf8');
const before = t;

const anchor = '    getAudio().reel();';
const replacement = [
'    if (useStrip) {',
'      sfx.spinStart();',
'      setReelDone(0);',
'      const colsArr = [];',
'      for (let c = 0; c < REELS; c++) colsArr.push(r.grid.slice(c * rows, c * rows + rows));',
'      const anticipate = (r.scatters || []).some(function (idx) { return idx < rows * 2; });',
'      await Promise.all(colsArr.map(function (col, ci) {',
'        const h = reelRefs.current[ci];',
'        if (!h) return Promise.resolve();',
'        return new Promise(function (res) { window.setTimeout(function () { h.spin(col, ci, { turbo: turbo, anticipate: anticipate && ci >= 2 }).then(res); }, ci * (turbo ? 60 : 150)); });',
'      }));',
'      sfx.spinStop();',
'    } else {',
'      getAudio().reel();',
'      const el = boardRef.current;',
'      if (el) { const cells = el.querySelectorAll("[data-c]"); gsap.fromTo(cells, { y: -40, opacity: 0.25 }, { y: 0, opacity: 1, duration: turbo ? 0.2 : 0.4, stagger: { each: 0.014, from: "start" }, ease: "back.out(1.4)" }); }',
'      await new Promise(function (res) { window.setTimeout(res, turbo ? 240 : 520); });',
'    }'
].join('\n');

const idx = t.indexOf(anchor);
if (idx >= 0 && !t.includes('sfx.spinStart')) {
  // remove the old wait line that follows getAudio().reel();
  const afterAnchor = t.indexOf('\n', idx);
  const nextLineEnd = t.indexOf('\n', afterAnchor + 1);
  const followingLine = t.substring(afterAnchor + 1, nextLineEnd);
  let cutEnd = nextLineEnd;
  if (followingLine.includes('window.setTimeout(res, turbo ? 240 : 520)')) {
    cutEnd = nextLineEnd;
  } else {
    cutEnd = afterAnchor;
  }
  t = t.substring(0, idx) + replacement + t.substring(cutEnd);
  fs.writeFileSync(f, t, 'utf8');
  console.log('patched via single-line anchor');
} else if (t.includes('sfx.spinStart')) {
  console.log('already patched');
} else {
  console.log('ERROR: anchor getAudio().reel(); not found');
}

const after = fs.readFileSync(f, 'utf8');
console.log('has spinStart=' + after.includes('sfx.spinStart'));
console.log('has reelRefs spin call=' + after.includes('reelRefs.current[ci]'));
console.log('braces balanced=' + ((after.match(/\{/g)||[]).length === (after.match(/\}/g)||[]).length));
console.log('parens balanced=' + ((after.match(/\(/g)||[]).length === (after.match(/\)/g)||[]).length));
console.log('changed=' + (after !== before));
