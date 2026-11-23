const fs = require('fs');
const p = 'app/globals.css';
let c = fs.readFileSync(p, 'utf8');
const marks = ['/* == KB3 REGISTRY FIX G3 G4 == */', '/* == KB3 HOLD FEEDBACK H1 H3 == */', '/* == KB3 HOLD CELLS == */', '/* == KB3 HOLD LOGO+MASCOT == */'];
for (const mk of marks) {
  let s = c.indexOf(mk);
  while (s >= 0) {
    const nx = c.indexOf('/* ==', s + 10);
    c = c.substring(0, s) + (nx >= 0 ? c.substring(nx) : '');
    s = c.indexOf(mk);
  }
}
const L = [];
L.push('');
L.push('/* == KB3 HOLD LAYOUT FINAL == */');
L.push('.k9-body{display:grid !important;grid-template-columns:190px minmax(0,1fr) 300px !important;gap:16px !important;align-items:start !important;width:100%;}');
L.push('.kb3-sidecol{grid-column:1;display:flex;justify-content:center;align-items:flex-start;padding-top:70px;pointer-events:none;}');
L.push('.kb3-sidecol .kb-character{animation:kb-breathe 3s ease-in-out infinite;filter:drop-shadow(0 12px 26px rgba(0,0,0,.6));}');
L.push('.k9-stage{grid-column:2;position:relative;border-radius:16px;padding:18px;min-height:520px;display:flex;flex-direction:column;justify-content:center;}');
L.push('.k9-panel{grid-column:3;}');
L.push('.k9-frame{position:relative;width:100%;max-width:640px;margin:0 auto;border:3px solid var(--acc,#e8b33c);border-radius:16px;padding:16px;background:rgba(4,6,10,.55);}');
L.push('.k9-banner{text-align:center;font:900 13px/1.3 Orbitron,system-ui;letter-spacing:1.5px;color:var(--acc2,#ffd97a);margin-bottom:12px;}');
L.push('.k9-meters{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}');
L.push('.k9-meters > div{background:rgba(4,6,10,.6);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px;text-align:center;}');
L.push('.k9-grid{display:grid !important;gap:8px !important;width:100%;}');
L.push('.k9-cell{position:relative;aspect-ratio:1/1;min-height:78px;border-radius:12px;background:linear-gradient(180deg,rgba(10,14,24,.72),rgba(4,6,12,.86));border:1px solid rgba(255,255,255,.1);display:grid;place-items:center;overflow:hidden;}');
L.push('.k9-cell.held{border-color:var(--acc,#e8b33c);box-shadow:inset 0 0 0 2px rgba(255,217,122,.4),0 0 16px rgba(255,217,122,.2);}');
L.push('.k9-cell.jackpot{box-shadow:inset 0 0 0 2px #ffd97a,0 0 24px rgba(255,217,122,.55);}');
L.push('.kb3-hcell{position:relative;display:grid;place-items:center;width:100%;height:100%;}');
L.push('.kb3-hcell.empty .kb3-hsym{display:none !important;}');
L.push('.kb3-hsym{width:74%;height:74%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55));}');
L.push('.kb3-hval{position:absolute;bottom:5%;left:50%;transform:translateX(-50%);font:900 12px/1 Orbitron,system-ui;color:#fff;background:rgba(4,6,10,.85);border:1px solid var(--acc,#ffd97a);border-radius:10px;padding:3px 8px;white-space:nowrap;}');
L.push('.k9-mascot{display:none !important;}');
L.push('.k9-vol{margin-top:12px;text-align:center;}');
L.push('.kb3-nocoin{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:45;background:rgba(4,6,10,.92);border:1px solid #ff6b6b;color:#ffb4b4;font:900 14px/1 Orbitron,system-ui;letter-spacing:2px;padding:10px 22px;border-radius:12px;pointer-events:none;}');
L.push('@media(max-width:1100px){.k9-body{grid-template-columns:150px minmax(0,1fr) 260px !important;}.k9-cell{min-height:64px;}}');
L.push('@media(max-width:900px){.k9-body{grid-template-columns:minmax(0,1fr) !important;}.kb3-sidecol{grid-column:1;grid-row:1;padding-top:0;}.kb3-sidecol .kb-character{transform:scale(.62);}.k9-stage{grid-column:1;grid-row:2;min-height:auto;}.k9-panel{grid-column:1;grid-row:3;}.k9-cell{min-height:56px;}}');
fs.writeFileSync(p, c + L.join('\n') + '\n', 'utf8');
const all = fs.readFileSync(p, 'utf8');
const o = (all.match(/\{/g) || []).length;
const cl = (all.match(/\}/g) || []).length;
console.log('braces balanced=' + (o === cl) + ' (' + o + '/' + cl + ')');
console.log('has layout marker=' + all.includes('KB3 HOLD LAYOUT FINAL'));
console.log('old flex removed=' + !all.includes('.k9-body{display:flex;gap:14px'));
