const sharp = require("sharp");
const fs = require("fs");
const path = "public/assets/ember-rocket/character-side.png";
const origPath = "public/assets_original/ember-rocket/character-side.png";

if (!fs.existsSync("public/assets_original/ember-rocket")) {
  fs.mkdirSync("public/assets_original/ember-rocket", { recursive: true });
}
if (!fs.existsSync(origPath)) {
  fs.copyFileSync(path, origPath);
}

sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).then(async function ({ data, info }) {
  const w = info.width, h = info.height, ch = info.channels;
  const mask = new Uint8Array(w * h);
  const stack = [];
  
  function isBg(i) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    return r >= 238 && g >= 238 && b >= 238;
  }
  
  function push(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!mask[p] && isBg(p)) { mask[p] = 1; stack.push(p); }
  }
  
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = Math.floor(p / w);
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  
  for (let p = 0; p < w * h; p++) {
    if (mask[p]) { data[p * ch + 3] = 0; }
    else {
      const x = p % w, y = Math.floor(p / w);
      let edge = false;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) edge = true;
        }
      }
      if (edge) {
        const r = data[p * ch], g = data[p * ch + 1], b = data[p * ch + 2];
        const mn = Math.min(r, g, b);
        if (mn > 200) data[p * ch + 3] = Math.max(0, Math.min(255, 255 - Math.round((mn - 200) * 4)));
      }
    }
  }
  
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(path);
  console.log("SUCCESS: " + path);
}).catch(function (e) { console.log("ERROR: " + e.message); });
