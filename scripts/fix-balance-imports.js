const fs = require("fs");

function fixGame(f, label) {
  if (!fs.existsSync(f)) { console.log("SKIP " + f); return; }
  let t = fs.readFileSync(f, "utf8");
  // إضافة useBalance إن لم يكن موجوداً
  if (!t.includes("useBalance")) {
    // البحث عن أول import من "@/lib" أو "@/components" أو أي import
    const importMatch = t.match(/^import\s+[^;]+;/m);
    if (importMatch) {
      t = t.replace(importMatch[0], importMatch[0] + '\nimport { useBalance } from "@/lib/balance-context";');
      console.log(label + ": added useBalance import after " + importMatch[0].substring(0, 40));
    } else {
      console.log(label + ": WARNING no import found");
    }
  }
  fs.writeFileSync(f, t, "utf8");
}

fixGame("src/kb3/slots/atlas-skyfall/AtlasGame.tsx", "Atlas");
fixGame("src/kb3/slots/falcon-dunes/FalconGame.tsx", "Falcon");
fixGame("src/kb3/slots/moon-rabbit-mint/MoonGame.tsx", "Moon");
