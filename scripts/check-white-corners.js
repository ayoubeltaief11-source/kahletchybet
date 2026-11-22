const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ASSETS = path.join(__dirname, '..', 'public', 'assets');
const ORIG = path.join(__dirname, '..', 'public', 'assets_original');
const FIX = process.argv.indexOf('--fix') >= 0;
const TH = 240;

function isWhite(r, g, b) { return r >= TH && g >= TH && b >= TH; }

function flood(data, w, h, sx, sy) {
  const seen = new Uint8Array(w * h);
  const out = [];
  const st = [[sx, sy]];
  while (st.length) {
    const [x, y] = st.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = y * w + x;
    if (seen[i]) continue;
    seen[i] = 1;
    const p = i * 4;
    if (!isWhite(data[p], data[p + 1], data[p + 2])) continue;
    out.push(i);
    st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return out;
}

async function cornerState(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
  let whiteCorners = 0;
  for (const c of corners) {
    const p = c * 4;
    if (data[p + 3] > 200 && isWhite(data[p], data[p + 1], data[p + 2])) whiteCorners++;
  }
  return { data, w, h, whiteCorners };
}

async function fix(file, data, w, h) {
  const bg = new Set();
  const seeds = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1], [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)]];
  for (const [x, y] of seeds) for (const i of flood(data, w, h, x, y)) bg.add(i);
  if (!bg.size) return 0;
  const isBg = new Uint8Array(w * h);
  for (const i of bg) isBg[i] = 1;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (isBg[i]) { out[p] = 0; out[p + 1] = 0; out[p + 2] = 0; out[p + 3] = 0; }
    else { out[p] = data[p]; out[p + 1] = data[p + 1]; out[p + 2] = data[p + 2]; out[p + 3] = data[p + 3]; }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
  return bg.size;
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets_original') walk(full, acc); }
    else if (/\.png$/i.test(e.name)) acc.push(full);
  }
  return acc;
}

(async function () {
  const files = walk(ASSETS, []);
  let bad = 0, fixed = 0;
  for (const f of files) {
    try {
      const s = await cornerState(f);
      const rel = path.relative(ASSETS, f);
      if (s.whiteCorners > 0) {
        bad++;
        if (FIX) {
          const relDir = path.dirname(rel);
          const origDir = path.join(ORIG, relDir);
          fs.mkdirSync(origDir, { recursive: true });
          const origFile = path.join(ORIG, rel);
          if (!fs.existsSync(origFile)) fs.copyFileSync(f, origFile);
          const n = await fix(f, s.data, s.w, s.h);
          fixed++;
          console.log('  FIXED ' + rel + ' (' + n + ' px)');
        } else {
          console.log('  WHITE ' + rel + ' corners=' + s.whiteCorners);
        }
      }
    } catch (e) { console.log('  ERR   ' + path.relative(ASSETS, f) + ' ' + e.message); }
  }
  console.log('');
  console.log(FIX ? ('Fixed: ' + fixed + ' / white-found: ' + bad) : ('Images with white corners: ' + bad + '  (run with --fix to clean)'));
})();
