const sharp = require("sharp");
const fs = require("fs");
const games = ["skyward-jet", "ember-rocket", "drift-balloon", "rotor-heli", "nightglide-stealth"];
const files = ["character-side.png", "character.png"];
const outDir = "public/assets/_fixed";

async function processImage(src, dst) {
  try {
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height, ch = info.channels;
    const mask = new Uint8Array(w * h);
    const stack = [];
    function isBg(i) { return data[i*ch] >= 238 && data[i*ch+1] >= 238 && data[i*ch+2] >= 238; }
    function push(x, y) { if (x<0||y<0||x>=w||y>=h) return; const p=y*w+x; if (!mask[p] && isBg(p)) { mask[p]=1; stack.push(p); } }
    for (let x=0; x<w; x++) { push(x,0); push(x,h-1); }
    for (let y=0; y<h; y++) { push(0,y); push(w-1,y); }
    while (stack.length) { const p=stack.pop(); const x=p%w, y=Math.floor(p/w); push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1); }
    for (let p=0; p<w*h; p++) {
      if (mask[p]) { data[p*ch+3] = 0; continue; }
      const x=p%w, y=Math.floor(p/w); let edge=false;
      for (let dx=-2; dx<=2; dx++) for (let dy=-2; dy<=2; dy++) { const nx=x+dx, ny=y+dy; if (nx>=0&&ny>=0&&nx<w&&ny<h&&mask[ny*w+nx]) edge=true; }
      if (edge) { const mn=Math.min(data[p*ch],data[p*ch+1],data[p*ch+2]); if (mn>200) data[p*ch+3]=Math.max(0, 255-Math.round((mn-200)*4)); }
    }
    await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(dst);
    return true;
  } catch (e) { console.log("FAIL: " + src + " -> " + e.message); return false; }
}

(async () => {
  let count = 0;
  for (const game of games) {
    for (const file of files) {
      const src = `public/assets/${game}/${file}`;
      const dst = `${outDir}/${game}_${file}`;
      if (fs.existsSync(src)) { if (await processImage(src, dst)) { console.log("OK: " + game + "/" + file); count++; } }
    }
  }
  console.log("DONE: " + count + " images processed.");
})();
