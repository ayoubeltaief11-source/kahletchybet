const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");

// إزالة تعريف slug المكرر إذا وجد
const lines = t.split("\n");
let slugCount = 0;
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const slug = route.split("/").pop() || "skyward-jet";')) {
    slugCount++;
    if (slugCount === 1) {
      newLines.push(lines[i]); // الاحتفاظ بالأول فقط
    }
  } else {
    newLines.push(lines[i]);
  }
}

t = newLines.join("\n");
fs.writeFileSync(f, t, "utf8");
console.log("Duplicate 'slug' removed. Total 'slug' definitions: " + slugCount);
