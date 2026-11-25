const fs = require("fs");
const fc = "scripts/chroma-key.js";
let c = fs.readFileSync(fc, "utf8");
const oldFn = `  function isMagenta(i) {
    const r = d[i*ch], g = d[i*ch+1], b = d[i*ch+2], a = d[i*ch+3];
    if (a === 0) return false;
    return dist([r,g,b], [MAGENTA.r, MAGENTA.g, MAGENTA.b]) <= TOLERANCE;
  }`;
const newFn = `  const cornerIdx = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
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
  }`;
if (c.includes(oldFn)) { c = c.split(oldFn).join(newFn); fs.writeFileSync(fc, c, "utf8"); console.log("auto key-color detection added"); }
else console.log("MISS isMagenta block");
