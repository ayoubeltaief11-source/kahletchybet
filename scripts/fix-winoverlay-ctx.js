const fs = require('fs');
const f = 'src/kb3/slots/WinOverlay.tsx';
let t = fs.readFileSync(f, 'utf8');

// The problem: ctx is narrowed to non-null in outer scope, but lost inside draw() closure
// Solution: capture a local const that TS knows is definitely CanvasRenderingContext2D

const oldBlock = [
'      if (coinCanvasRef.current) {',
'        const cv = coinCanvasRef.current;',
'        const ctx = cv.getContext("2d");',
'        if (ctx) {',
'          cv.width = el.offsetWidth;',
'          cv.height = el.offsetHeight;'
].join('\n');

const newBlock = [
'      if (coinCanvasRef.current) {',
'        const cv = coinCanvasRef.current;',
'        const rawCtx = cv.getContext("2d");',
'        if (!rawCtx) return;',
'        const ctx: CanvasRenderingContext2D = rawCtx;',
'        cv.width = el.offsetWidth;',
'        cv.height = el.offsetHeight;'
].join('\n');

if (t.includes(oldBlock)) {
  t = t.replace(oldBlock, newBlock);
  console.log('WinOverlay ctx fix applied');
} else {
  console.log('Exact anchor not found - showing context around line 65:');
  const lines = t.split('\n');
  for (let i = 60; i < 90 && i < lines.length; i++) {
    console.log((i+1) + ': ' + lines[i]);
  }
}

// Also remove the closing brace of the old if(ctx) block since we replaced it with early-return
// Find and remove the extra closing brace after the draw section ends
const oldClose = [
'          tl.call(function () { cancelAnimationFrame(animId); }, [], 5);',
'        }',
'      }'
].join('\n');

const newClose = [
'          tl.call(function () { cancelAnimationFrame(animId); }, [], 5);',
'      }'
].join('\n');

if (t.includes(oldClose)) {
  t = t.replace(oldClose, newClose);
  console.log('Extra closing brace removed');
} else {
  console.log('Note: close pattern not matched exactly - checking manually');
  // Show what's there
  const idx = t.indexOf('cancelAnimationFrame(animId)');
  if (idx >= 0) {
    console.log('Context around cancelAnimationFrame:');
    console.log(t.substring(idx - 20, idx + 80));
  }
}

fs.writeFileSync(f, t, 'utf8');
const ob = (t.match(/\{/g) || []).length;
const cb = (t.match(/\}/g) || []).length;
console.log('braces=' + ob + '/' + cb + ' balanced=' + (ob === cb));
