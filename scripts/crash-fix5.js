const fs = require("fs");
const f = "src/kb3/crash/crashEngine.ts";
let t = fs.readFileSync(f, "utf8");
t = t.replace('const rtp = 0.95 + Math.random() * 0.02;', 'const rtp = 0.96;');
t = t.replace('const seed = hashStr(gameId);', 'const seed = hashStr(gameId) + Date.now();');
t = t.replace('for (let i = 0; i < 15; i++) history.push(crashAtFromR(rng(), rtp));', 'for (let i = 0; i < 15; i++) { let r = rng(); if (i % 3 === 0) r = rng() * 0.3; else if (i % 5 === 0) r = 0.7 + rng() * 0.29; history.push(crashAtFromR(r, rtp)); }');
fs.writeFileSync(f, t, "utf8");
console.log("varied results: " + t.includes("i % 3 === 0"));
