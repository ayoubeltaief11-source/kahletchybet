const sharp = require("sharp");
const fs = require("fs");
const base = "public/assets/atlas-skyfall/";
(async function () {
  // 1) measure ring thickness of trimmed frame
  const fr = await sharp(base + "frame.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const fw = fr.info.width, fh = fr.info.height, fch = fr.info.channels;
  const midY = Math.floor(fh / 2);
  let R = 0;
  for (let x = 0; x < fw; x++) { const a = fr.data[(midY * fw + x) * fch + 3]; if (a > 8) R++; else break; }
  console.log("frame ring thickness px: " + R);
  // 2) clean grayish-white haze on characters (protect cyan orb: low min channel)
  for (const file of ["character.png", "character-cast.png"]) {
    const src = base + file;
    if (!fs.existsSync(src)) { console.log("skip " + file); continue; }
    const im = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = im.info.width, h = im.info.height, ch = im.info.channels;
    const d = im.data;
    for (let p = 0; p < w * h; p++) {
      const r = d[p*ch], g = d[p*ch+1], b = d[p*ch+2], a = d[p*ch+3];
      if (a === 0) continue;
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      if (mn >= 240 && (mx - mn) <= 12) d[p*ch+3] = 0;
      else if (mn >= 225 && (mx - mn) <= 20) d[p*ch+3] = Math.round(a * 0.35);
    }
    await sharp(d, { raw: { width: w, height: h, channels: ch } }).png().toFile(src + ".tmp");
    fs.copyFileSync(src + ".tmp", src); fs.unlinkSync(src + ".tmp");
    console.log("haze cleaned: " + file);
  }
  // 3) remove the overlay frame img from the component
  const gf = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
  let t = fs.readFileSync(gf, "utf8");
  t = t.split('          <img className="at-frame" src="/assets/atlas-skyfall/frame.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>\n').join("");
  fs.writeFileSync(gf, t, "utf8");
  console.log("frame overlay img removed: " + !t.includes('className="at-frame"'));
  // 4) real border-image around the grid using measured ring
  const css = "\n.at-grid{border:" + Math.max(18, Math.round(R * 0.35)) + "px solid transparent;border-image-source:url(/assets/atlas-skyfall/frame.png);border-image-slice:" + R + ";border-image-repeat:stretch;}\n";
  fs.appendFileSync("src/kb3/slots/atlas-skyfall/atlas.css", css);
  console.log("border-image applied with slice " + R);
})();
