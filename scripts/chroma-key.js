const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = "public/assets/falcon-dunes";
const ORIGINAL = "public/assets_original/falcon-dunes";
const MAGENTA = { r: 255, g: 0, b: 255 };
const TOLERANCE = 60;
const CROP_PCT = 0.02;

function dist(a, b) { return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2); }

function cornerAlpha(data, w, h, ch, margin) {
  const pts = [[margin, margin], [w - 1 - margin, margin], [margin, h - 1 - margin], [w - 1 - margin, h - 1 - margin]];
  return pts.map(function (p) { return data[(p[1] * w + p[0]) * ch + 3]; });
}

async function processImage(src, dst) {
  let img = sharp(src).ensureAlpha();
  const meta = await img.metadata();
  const cropPx = Math.max(1, Math.floor(Math.min(meta.width, meta.height) * CROP_PCT));
  img = img.extract({ left: cropPx, top: cropPx, width: meta.width - cropPx * 2, height: meta.height - cropPx * 2 });
  const raw = await img.raw().toBuffer({ resolveWithObject: true });
  const d = raw.data, w = raw.info.width, h = raw.info.height, ch = raw.info.channels;
  const before = cornerAlpha(d, w, h, ch, 0);

  const mask = new Uint8Array(w * h);
  const stack = [];
  const cornerIdx = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
  let cr = 0, cg = 0, cb = 0;
  cornerIdx.forEach(function (p) { cr += d[p*ch]; cg += d[p*ch+1]; cb += d[p*ch+2]; });
  cr /= 4; cg /= 4; cb /= 4;
  const keyMagenta = dist([cr,cg,cb], [255,0,255]) <= 140;
  const keyWhite = Math.min(cr,cg,cb) >= 235;
  function isMagenta(i) {
    const r = d[i*ch], g = d[i*ch+1], b = d[i*ch+2], a = d[i*ch+3];
    if (a === 0) return false;
    if (keyMagenta) return dist([r,g,b], [MAGENTA.r, MAGENTA.g, MAGENTA.b]) <= TOLERANCE;
    if (keyWhite) return r >= 238 && g >= 238 && b >= 238;
    return false;
  }
  function push(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!mask[p] && isMagenta(p)) { mask[p] = 1; stack.push(p); }
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = Math.floor(p / w);
    push(x+1, y); push(x-1, y); push(x, y+1); push(x, y-1);
  }

  // Despill: near edge of mask, reduce magenta reflection
  for (let p = 0; p < w * h; p++) {
    if (mask[p]) { d[p*ch+3] = 0; continue; }
    const x = p % w, y = Math.floor(p / w);
    let edgeDist = 999;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) edgeDist = Math.min(edgeDist, Math.sqrt(dx*dx + dy*dy));
    }
    if (edgeDist <= 2) {
      const r = d[p*ch], g = d[p*ch+1], b = d[p*ch+2];
      // Despill: reduce magenta channel dominance
      const avg = (r + b) / 2;
      if (r > g + 20 && b > g + 20) {
        const k = (1 - (edgeDist / 3)) * 0.7;
        d[p*ch] = Math.round(r * (1 - k) + avg * k);
        d[p*ch+2] = Math.round(b * (1 - k) + avg * k);
      }
      // Edge smoothing
      if (edgeDist <= 1) {
        const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
        if (mx - mn < 30 && mx > 200) d[p*ch+3] = Math.max(0, Math.round(d[p*ch+3] * 0.4));
      }
    }
  }

  // Trim transparent bounds
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * ch + 3] > 4) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) { console.log("SKIP empty: " + src); return; }
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const trimmed = Buffer.alloc(tw * th * ch);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const si = ((y + minY) * w + (x + minX)) * ch;
    const ti = (y * tw + x) * ch;
    for (let c = 0; c < ch; c++) trimmed[ti + c] = d[si + c];
  }

  await sharp(trimmed, { raw: { width: tw, height: th, channels: ch } }).png().toFile(dst + ".tmp");
  try { fs.renameSync(dst + ".tmp", dst); } catch (e) { console.log("LOCKED (close Explorer then rerun): " + dst); try { fs.unlinkSync(dst + ".tmp"); } catch (e2) {} return; }

  const afterRaw = await sharp(dst).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const after = cornerAlpha(afterRaw.data, afterRaw.info.width, afterRaw.info.height, afterRaw.info.channels, 0);
  console.log(src + "  before=" + before.join(",") + "  after=" + after.join(","));
  if (before.every(function (v) { return v === 255; }) && after.every(function (v) { return v === 255; })) {
    console.log("FAIL: corner still opaque on " + src);
    process.exitCode = 1;
  }
}

(async function () {
  const targets = [];
  function addIf(p) { if (fs.existsSync(p)) targets.push(p); }
  for (let i = 1; i <= 8; i++) addIf(ROOT + "/symbols/s" + i + ".png");
  addIf(ROOT + "/symbols/wild.png");
  addIf(ROOT + "/symbols/scatter.png");
  addIf(ROOT + "/falcon-statue.png");
  addIf(ROOT + "/fx/coin.png");
  for (const src of targets) {
    const rel = path.relative(ROOT, src);
    const dst = path.join(ORIGINAL, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    await processImage(src, src);
  }
  console.log("Processed: " + targets.length);
})();
