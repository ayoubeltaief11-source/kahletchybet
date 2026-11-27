const fs = require("fs");
const f = "components/CasinoStagePro.tsx";
let t = fs.readFileSync(f, "utf8");
// إضافة width/height للأيقونات
t = t.replace(/<svg className="pro-icon"/g, '<svg className="pro-icon" width="24" height="24"');
t = t.replace(/<svg className="pro-badge"/g, '<svg className="pro-badge" width="16" height="16"');
fs.writeFileSync(f, t, "utf8");
console.log("SVG dimensions fixed in CasinoStagePro.tsx");
