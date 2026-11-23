const fs = require('fs');
const f = 'src/kb3/slots/HoldWin.tsx';
let t = fs.readFileSync(f, 'utf8');

// Fix the broken JSX expression
const old = '<div className="kb3-jp-flash kb3-jp-" + jackpotHit}>{["MINI","MINOR","MAJOR","GRAND"][jackpotHit]} HIT!</div>';
const neu = '<div className={"kb3-jp-flash kb3-jp-" + jackpotHit}>{["MINI","MINOR","MAJOR","GRAND"][jackpotHit]} HIT!</div>';

if (t.includes(old)) {
  t = t.replace(old, neu);
  fs.writeFileSync(f, t, 'utf8');
  console.log('HoldWin line 81 fixed');
} else {
  console.log('Exact anchor not found - showing context:');
  const lines = t.split('\n');
  for (let i = 75; i < 90 && i < lines.length; i++) {
    console.log((i+1) + ': ' + lines[i]);
  }
}

// Verify braces still balanced
const ob = (t.match(/\{/g) || []).length;
const cb = (t.match(/\}/g) || []).length;
console.log('braces=' + ob + '/' + cb + ' balanced=' + (ob === cb));
