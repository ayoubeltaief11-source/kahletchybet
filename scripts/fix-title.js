const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");

// 1. إضافة استيراد getGame إذا لم يكن موجوداً
if (!t.includes('import { getGame }')) {
  t = t.replace('import { crashBySlug } from "@/lib/kb2/crashConfig";', 'import { crashBySlug } from "@/lib/kb2/crashConfig";\nimport { getGame } from "@/src/kb3/registry";');
}

// 2. تعريف slug بشكل صريح لاستخدامه في getGame
t = t.replace('const cfg = crashBySlug(route.split("/").pop() || "skyward");', 'const slug = route.split("/").pop() || "skyward-jet";\n  const cfg = crashBySlug(slug);');

// 3. استبدال العنوان الثابت بالعنوان الديناميكي من registry
t = t.replace('<b className="kb3-title">{cfg.name} <span className="kb3-live-tag">LIVE</span></b>', '<b className="kb3-title">{getGame(slug).title} <span className="kb3-live-tag">LIVE</span></b>');

fs.writeFileSync(f, t, "utf8");
console.log("DONE: Title updated to getGame(slug).title");
console.log("Has getGame import: " + t.includes('import { getGame }'));
console.log("Has slug def: " + t.includes('const slug = route.split'));
