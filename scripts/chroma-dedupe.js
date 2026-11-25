const fs = require("fs");
const fc = "scripts/chroma-key.js";
let c = fs.readFileSync(fc, "utf8");
c = c.split("  const targets = [];\n  const targets = [];").join("  const targets = [];");
fs.writeFileSync(fc, c, "utf8");
const n = (c.match(/const targets = \[\];/g) || []).length;
console.log("targets declarations now: " + n);
