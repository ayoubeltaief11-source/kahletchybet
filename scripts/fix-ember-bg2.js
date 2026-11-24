const sharp = require("sharp");
const fs = require("fs");
const src = "public/assets/ember-rocket/character-side.png";
const tmp = "public/assets/ember-rocket/_tmp.png";
sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).then(async function ({ data, info }) {
  const w = info.width, h = info.height, ch = info.channels;
  const mask = new Uint8Array(w * h);
  const stack = [];
  function isBg(i) { return data[i*ch] >= 238 && data[i*ch+1] >= 238 && data[i*ch+2] >= 238; }
  function push(x, y) { if (x<0||y<0||x>=w||y>=h) return; const p=y*w+x; if (!mask[p] && isBg(p)) { mask[p]=1; stack.push(p); } }
  for (let x=0;x<w;x++){push(x,0);push(x,h-1);}
  for (let y=0;y<h;y++){push(0,y);push(w-1,y);}
  while (stack.length) { const p=stack.pop(); const x=p%w, y=Math.floor(p/w); push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1); }
  for (let p=0;p<w*h;p++) {
    if (mask[p]) { data[p*ch+3]=0; continue; }
    const x=p%w, y=Math.floor(p/w); let edge=false;
    for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++) { const nx=x+dx, ny=y+dy; if (nx>=0&&ny>=0&&nx<w&&ny<h&&mask[ny*w+nx]) edge=true; }
    if (edge) { const mn=Math.min(data[p*ch],data[p*ch+1],data[p*ch+2]); if (mn>200) data[p*ch+3]=Math.max(0,255-Math.round((mn-200)*4)); }
  }
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(tmp);
  fs.copyFileSync(tmp, src); fs.unlinkSync(tmp);
  console.log("WROTE OK");
}).catch(function (e) { console.log("ERROR: " + e.message); });
