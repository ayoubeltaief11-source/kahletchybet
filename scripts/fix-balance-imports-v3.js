const fs = require("fs");
const files = [
  { path: "src/kb3/slots/atlas-skyfall/AtlasGame.tsx", label: "Atlas" },
  { path: "src/kb3/slots/falcon-dunes/FalconGame.tsx", label: "Falcon" },
  { path: "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx", label: "Moon" }
];
const importLine = 'import { useBalance } from "@/lib/balance-context";';

for (const { path, label } of files) {
  if (!fs.existsSync(path)) {
    console.log(label + ": FILE NOT FOUND");
    continue;
  }
  let t = fs.readFileSync(path, "utf8");
  // التحقق من وجود الاستيراد الفعلي، وليس فقط استخدام الدالة
  if (t.includes('from "@/lib/balance-context"')) {
    console.log(label + ": import already exists");
    continue;
  }
  // إضافة الاستيراد بعد أول import
  const lines = t.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) {
      lines.splice(i + 1, 0, importLine);
      console.log(label + ": inserted after line " + (i + 1));
      break;
    }
  }
  fs.writeFileSync(path, lines.join("\n"), "utf8");
}
