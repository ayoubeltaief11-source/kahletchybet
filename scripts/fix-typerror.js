const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");

// إصلاح نوع hideNear ليكون boolean صريح
t = t.replace("drawLayer(imgs.near, 0.7, 0.3, 0.25, 0.35, g.hideNear);", "drawLayer(imgs.near, 0.7, 0.3, 0.25, 0.35, !!g.hideNear);");

fs.writeFileSync(f, t, "utf8");
console.log("Fixed hideNear boolean type error.");
