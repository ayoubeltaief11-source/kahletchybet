const sharp = require("sharp");
const fs = require("fs");
const { execSync } = require("child_process");
const base = "public/assets/atlas-skyfall/";
(async function () {
  // 1) real trim to opaque bounds
  const src = base + "frame.png";
  const raw = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = raw.info.width, h = raw.info.height, ch = raw.info.channels;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (raw.data[(y * w + x) * ch + 3] > 8) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  console.log("opaque bbox: " + minX + "," + minY + " -> " + maxX + "," + maxY);
  if (maxX > minX && maxY > minY) {
    const tmp = src + ".tr.png";
    await sharp(src).extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }).png().toFile(tmp);
    fs.copyFileSync(tmp, src); fs.unlinkSync(tmp);
  }
  // 2) measure ring on trimmed
  const tr = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tw = tr.info.width, th = tr.info.height, tch = tr.info.channels;
  let R = 0; const midY = Math.floor(th / 2);
  for (let x = 0; x < tw; x++) { if (tr.data[(midY * tw + x) * tch + 3] > 8) R++; else break; }
  const slice = R > 0 ? String(R) : "18%";
  console.log("ring px after trim: " + R + " -> slice " + slice);
  // 3) corrected border-image rule (overrides slice:0)
  fs.appendFileSync("src/kb3/slots/atlas-skyfall/atlas.css", "\n.at-grid{border:24px solid transparent;border-image-source:url(/assets/atlas-skyfall/frame.png);border-image-slice:" + slice + ";border-image-width:24px;border-image-repeat:stretch;}\n");
  console.log("frame css corrected");
  // 4) alpha videos via ffmpeg-static
  let ffmpegPath = null;
  try { ffmpegPath = require("ffmpeg-static"); } catch (e) { console.log("ffmpeg-static missing"); }
  if (ffmpegPath) {
    for (const n of ["character-idle", "character-win"]) {
      const bak = base + "video/" + n + ".webm.bak";
      const out = base + "video/" + n + ".webm";
      const srcv = fs.existsSync(bak) ? bak : out;
      try {
        execSync('"' + ffmpegPath + '" -y -i "' + srcv + '" -vf "colorkey=0xFFFFFF:0.30:0.20" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 "' + out + '"', { stdio: "pipe" });
        console.log("alpha video: " + n + ".webm");
      } catch (e) { console.log("video fail " + n + ": " + (e.stderr ? e.stderr.toString().slice(-200) : e.message)); }
    }
  }
})();
