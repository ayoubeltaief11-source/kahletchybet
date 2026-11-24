const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const games = ["skyward-jet", "ember-rocket", "drift-balloon", "rotor-heli", "nightglide-stealth"];
const files = ["character-side.png", "character.png"];
const threshold = 238;
const edgeSmooth = 2;

async function removeBg(srcPath, dstPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  const mask = new Uint8Array(w * h);
  const stack = [];
  
  function isBg(i) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  }
  
  function push(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!mask[p] && isBg(p)) {
      mask[p] = 1;
      stack.push(p);
    }
  }
  
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = Math.floor(p / w);
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  
  for (let p = 0; p < w * h; p++) {
    if (mask[p]) { data[p * ch + 3] = 0; continue; }
    const x = p % w, y = Math.floor(p / w);
    let edge = false;
    for (let dx = -edgeSmooth; dx <= edgeSmooth; dx++) {
      for (let dy = -edgeSmooth; dy <= edgeSmooth; dy++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (mask[ny * w + nx]) edge = true;
      }
    }
    if (edge) {
      const r = data[p * ch], g = data[p * ch + 1], b = data[p * ch + 2];
      const mn = Math.min(r, g, b);
      if (mn > 200) data[p * ch + 3] = Math.max(0, Math.min(255, 255 - Math.round((mn - 200) * 4)));
    }
  }
  
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(dstPath);
}

(async function () {
  let count = 0;
  for (const gameId of games) {
    for (const file of files) {
      const src = path.join("public", "assets", gameId, file);
      const orig = path.join("public", "assets_original", gameId, file);
      const dst = src;
      if (!fs.existsSync(src)) { console.log("SKIP " + src); continue; }
      if (!fs.existsSync(path.join("public", "assets_original", gameId))) {
        fs.mkdirSync(path.join("public", "assets_original", gameId), { recursive: true });
      }
      if (!fs.existsSync(orig)) fs.copyFileSync(src, orig);
      await removeBg(src, dst);
      console.log("PROCESSED " + gameId + "/" + file);
      count++;
    }
  }
  console.log("Total: " + count + " images processed");
  console.log("Revert: Copy-Item -Recurse -Path public\\assets_original\\* -Destination public\\assets\\ -Force");
})();
