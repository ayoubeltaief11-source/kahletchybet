const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const TARGET_FILE = process.argv[2];
const TOL = parseInt(process.argv[3]) || 90;
if (!TARGET_FILE) { console.log("Usage: node chroma-key-v2.js symbols/s1.png [tol]"); process.exit(1); }

const ROOT = "public/assets/moon-rabbit-mint";
const ORIGINAL = "public/assets_original/moon-rabbit-mint";
const src = path.join(ROOT, TARGET_FILE);
const dst = path.join(ORIGINAL, TARGET_FILE);
if (!fs.existsSync(src)) { console.log("File not found: " + src); process.exit(1); }
fs.mkdirSync(path.dirname(dst), { recursive: true });
if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);

(async function () {
  let img = sharp(src).ensureAlpha();
  const meta = await img.metadata();
  const cropPx = Math.max(1, Math.floor(Math.min(meta.width, meta.height) * 0.02));
  img = img.extract({ left: cropPx, top: cropPx, width: meta.width - cropPx * 2, height: meta.height - cropPx * 2 });
  const raw = await img.raw().toBuffer({ resolveWithObject: true });
  const d = raw.data, w = raw.info.width, h = raw.info.height, ch = raw.info.channels;
  const corners = [[0,0], [w-1,0], [0,h-1], [w-1,h-1]];
  const alphaBefore = corners.map(function (p) { return d[(p[1]*w+p[0])*ch+3]; });
  console.log("Before corner alpha: " + alphaBefore.join(","));

  for (let p = 0; p < w * h; p++) {
    const r = d[p*ch], g = d[p*ch+1], b = d[p*ch+2], a = d[p*ch+3];
    if (a === 0) continue;
    const dist = Math.sqrt((r-255)*(r-255) + g*g + (b-255)*(b-255));
    if (dist < TOL) d[p*ch+3] = 0;
    else if (dist < TOL + 60) d[p*ch+3] = Math.round(a * ((dist - TOL) / 60));
  }

  for (let p = 0; p < w * h; p++) {
    if (d[p*ch+3] === 0) continue;
    const r = d[p*ch], g = d[p*ch+1], b = d[p*ch+2];
    const spill = Math.max(0, Math.min(r, b) - g);
    if (spill > 0) { d[p*ch] = Math.max(0, r - spill); d[p*ch+2] = Math.max(0, b - spill); }
  }

  const a0 = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) a0[p] = d[p*ch+3];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (a0[p] === 0) continue;
      let minA = 255, sumA = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const a = a0[(y+dy)*w + (x+dx)];
          if (a < minA) minA = a;
          sumA += a;
        }
      }
      if (minA < 255) d[p*ch+3] = Math.min(d[p*ch+3], minA);
      d[p*ch+3] = Math.round(d[p*ch+3] * 0.7 + (sumA / 9) * 0.3);
    }
  }

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y*w+x)*ch+3] > 4) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) { console.log("SKIP: fully transparent"); return; }
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const size = Math.max(tw, th);
  const trimmed = Buffer.alloc(size * size * ch);
  const offX = Math.floor((size - tw) / 2), offY = Math.floor((size - th) / 2);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const si = ((y + minY) * w + (x + minX)) * ch;
      const ti = ((y + offY) * size + (x + offX)) * ch;
      for (let c = 0; c < ch; c++) trimmed[ti + c] = d[si + c];
    }
  }
  await sharp(trimmed, { raw: { width: size, height: size, channels: ch } }).png().toFile(src + ".tmp");
  fs.renameSync(src + ".tmp", src);

  const fr = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const fd = fr.data, fw = fr.info.width, fh = fr.info.height, fch = fr.info.channels;
  const alphaAfter = [[0,0],[fw-1,0],[0,fh-1],[fw-1,fh-1]].map(function (p) { return fd[(p[1]*fw+p[0])*fch+3]; });
  console.log("After corner alpha: " + alphaAfter.join(","));
  let pinkCount = 0;
  for (let p = 0; p < fw * fh; p++) {
    if (fd[p*fch+3] > 0 && fd[p*fch] > 180 && fd[p*fch+2] > 150 && fd[p*fch+1] < 110) pinkCount++;
  }
  console.log("Remaining pink pixels: " + pinkCount);
  if (pinkCount > 40 || alphaAfter.some(function (v) { return v === 255; })) {
    console.log("FAIL: " + TARGET_FILE + " pink=" + pinkCount + " corners=" + alphaAfter.join(","));
    process.exitCode = 1;
  } else console.log("PASS: " + TARGET_FILE);
})();
