const sharp = require("sharp");
const fs = require("fs");
const src = "public/assets/atlas-skyfall/frame.png";
(async function () {
  const tmp = src + ".trim.png";
  await sharp(src).trim({ threshold: 10 }).png().toFile(tmp);
  fs.copyFileSync(tmp, src); fs.unlinkSync(tmp);
  console.log("frame trimmed to its bronze bounds");
})();
