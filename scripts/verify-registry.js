const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src', 'kb3', 'registry.ts'), 'utf8');
const re = /id: "([a-z0-9-]+)", title: "([^"]+)", type: "([a-z]+)", pack: "([a-z]+)", assetDir: "([a-z0-9-]+)"/g;
const rows = [];
let m;
while ((m = re.exec(src)) !== null) rows.push({ id: m[1], title: m[2], type: m[3], pack: m[4], dir: m[5] });
console.log('id'.padEnd(22) + 'title'.padEnd(22) + 'pack'.padEnd(9) + 's1-9  char  bg  cover');
console.log('-'.repeat(80));
let fail = 0;
for (const r of rows) {
  let syms = true;
  for (let i = 1; i <= 9; i++) {
    if (!fs.existsSync(path.join(ROOT, 'public', 'assets', 'packs', r.pack, 's' + i + '.png'))) syms = false;
  }
  const ch = fs.existsSync(path.join(ROOT, 'public', 'assets', r.dir, 'character.png'));
  const bg = fs.existsSync(path.join(ROOT, 'public', 'assets', r.dir, 'bg.jpg'));
  const cv = fs.existsSync(path.join(ROOT, 'public', 'assets', r.dir, 'cover.png'));
  if (!syms || !ch || !bg || !cv) fail++;
  console.log(r.id.padEnd(22) + r.title.padEnd(22) + r.pack.padEnd(9) + (syms ? 'YES' : 'NO ').padEnd(6) + (ch ? 'YES' : 'NO ').padEnd(6) + (bg ? 'YES' : 'NO ').padEnd(4) + (cv ? 'YES' : 'NO'));
}
console.log('-'.repeat(80));
console.log('total=' + rows.length + ' failures=' + fail);
if (rows.length !== 30) { console.error('ERROR: registry must have 30 games, found ' + rows.length); process.exit(1); }
if (fail > 0) { console.error('ERROR: missing assets'); process.exit(1); }
console.log('REGISTRY OK: 30 games, all assets present');
