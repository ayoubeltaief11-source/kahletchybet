const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");
const lines = t.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className={"kb3-chip " + cls}') && !lines[i - 1].includes("const cls =")) {
    lines[i] = '          const cls = h.crash >= 10 ? "mega" : h.crash >= 2 ? "hi" : h.crash >= 1.3 ? "mid" : "lo";\n' + lines[i];
    break;
  }
}
fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("fixed line: " + lines.some(function (l) { return l.includes('const cls = h.crash >= 10 ? "mega"'); }));
