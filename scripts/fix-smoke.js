const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");

// البحث عن كود رسم الدخان وتعديل الـ composite operation والشفافية
const oldSmoke = `if (q.kind === 0) { ctx!.globalCompositeOperation = "lighter"; ctx!.globalAlpha = a * 0.5; if (imgs.smoke) { ctx!.drawImage(imgs.smoke, q.x - q.size, q.y - q.size, q.size * 2, q.size * 2); } else { ctx!.fillStyle = q.col + (a * 0.5).toFixed(2) + ")"; ctx!.beginPath(); ctx!.arc(q.x, q.y, q.size, 0, 6.283); ctx!.fill(); } ctx!.globalCompositeOperation = "source-over"; }`;

const newSmoke = `if (q.kind === 0) { ctx!.globalCompositeOperation = "screen"; ctx!.globalAlpha = a * 0.25; if (imgs.smoke) { ctx!.drawImage(imgs.smoke, q.x - q.size, q.y - q.size, q.size * 2, q.size * 2); } else { ctx!.fillStyle = q.col + (a * 0.25).toFixed(2) + ")"; ctx!.beginPath(); ctx!.arc(q.x, q.y, q.size, 0, 6.283); ctx!.fill(); } ctx!.globalCompositeOperation = "source-over"; }`;

if (t.includes(oldSmoke)) {
  t = t.replace(oldSmoke, newSmoke);
  fs.writeFileSync(f, t, "utf8");
  console.log("DONE: Smoke updated to 'screen' blend mode and 0.25 max opacity.");
} else {
  console.log("WARN: Could not find exact smoke block. Checking current state...");
  // محاولة بديلة إذا كان التنسيق مختلفاً قليلاً
  if (t.includes('q.kind === 0')) {
    t = t.replace(/ctx!\.globalCompositeOperation = "lighter"; ctx!\.globalAlpha = a \* 0\.5;/g, 'ctx!.globalCompositeOperation = "screen"; ctx!.globalAlpha = a * 0.25;');
    t = t.replace(/\(a \* 0\.5\)\.toFixed\(2\)/g, '(a * 0.25).toFixed(2)');
    fs.writeFileSync(f, t, "utf8");
    console.log("DONE: Smoke updated via fallback regex.");
  } else {
    console.log("ERROR: Smoke block not found at all.");
  }
}
