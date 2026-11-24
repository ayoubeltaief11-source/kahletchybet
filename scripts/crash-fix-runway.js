const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");
const before = t.split("\n").length;
const lines = t.split("\n").filter(function (l) { return !l.includes("rgba(16,20,28,0.95)"); });
t = lines.join("\n");
fs.writeFileSync(f, t, "utf8");
console.log("runway line removed: " + !t.includes("rgba(16,20,28,0.95)"));
console.log("lines before/after: " + before + "/" + lines.length);
