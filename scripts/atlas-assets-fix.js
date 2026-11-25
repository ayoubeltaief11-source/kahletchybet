const sharp = require("sharp");
const fs = require("fs");
const base = "public/assets/atlas-skyfall/";

async function globalWhiteToAlpha(file, thr) {
  const src = base + file;
  if (!fs.existsSync(src)) { console.log("skip " + file); return; }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  for (let p = 0; p < w * h; p++) {
    const r = data[p*ch], g = data[p*ch+1], b = data[p*ch+2];
    const mn = Math.min(r, g, b);
    if (mn >= thr) data[p*ch+3] = 0;
    else if (mn >= thr - 18) data[p*ch+3] = Math.max(0, 255 - Math.round((mn - (thr - 18)) * (255 / 18)));
  }
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(src + ".tmp");
  fs.copyFileSync(src + ".tmp", src); fs.unlinkSync(src + ".tmp");
  console.log("frame center transparent: " + file);
}

async function floodRemove(file, thr) {
  const src = base + file;
  if (!fs.existsSync(src)) { console.log("skip " + file); return; }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  const mask = new Uint8Array(w * h); const stack = [];
  const isBg = function (i) { return data[i*ch] >= thr && data[i*ch+1] >= thr && data[i*ch+2] >= thr; };
  const push = function (x, y) { if (x<0||y<0||x>=w||y>=h) return; const p=y*w+x; if (!mask[p] && isBg(p)) { mask[p]=1; stack.push(p); } };
  for (let x=0;x<w;x++){push(x,0);push(x,h-1);} for (let y=0;y<h;y++){push(0,y);push(w-1,y);}
  while (stack.length) { const p=stack.pop(); const x=p%w,y=Math.floor(p/w); push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1); }
  for (let p=0;p<w*h;p++) {
    if (mask[p]) { data[p*ch+3]=0; continue; }
    const x=p%w,y=Math.floor(p/w); let edge=false;
    for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w&&ny<h&&mask[ny*w+nx])edge=true;}
    if (edge){const mn=Math.min(data[p*ch],data[p*ch+1],data[p*ch+2]);if(mn>200)data[p*ch+3]=Math.max(0,255-Math.round((mn-200)*4));}
  }
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(src + ".tmp");
  fs.copyFileSync(src + ".tmp", src); fs.unlinkSync(src + ".tmp");
  console.log("character bg removed: " + file);
}

(async function () {
  await globalWhiteToAlpha("frame.png", 245);
  await floodRemove("character.png", 238);
  await floodRemove("character-cast.png", 238);
})();
