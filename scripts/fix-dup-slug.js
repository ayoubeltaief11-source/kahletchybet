const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");
const lines = t.split("\n");
let slugCount = 0;
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const slug = route.split("/").pop() || "skyward-jet";')) {
    slugCount++;
    if (slugCount === 1) newLines.push(lines[i]);
  } else {
    newLines.push(lines[i]);
  }
}
fs.writeFileSync(f, newLines.join("\n"), "utf8");
console.log("Fixed duplicate slug. Count: " + slugCount);
