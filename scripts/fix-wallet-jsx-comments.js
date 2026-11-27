const fs = require("fs");
const f = "app/wallet/page.tsx";
let t = fs.readFileSync(f, "utf8");
// استبدال تعليقات HTML بتعليقات JSX
t = t.replace(/<!--\s*DEPOSIT button moved to \/admin\/td\s*-->/g, "{/* DEPOSIT button moved to /admin/td */}");
t = t.replace(/<!--\s*WITHDRAW button moved to \/admin\/td\s*-->/g, "{/* WITHDRAW button moved to /admin/td */}");
t = t.replace(/<!--\s*Modal moved to \/admin\/td\s*-->/g, "{/* Modal moved to /admin/td */}");
t = t.replace(/<!--\s*amount state removed\s*-->/g, "{/* amount state removed */}");
t = t.replace(/<!--\s*method state removed\s*-->/g, "{/* method state removed */}");
t = t.replace(/<!--\s*submit function removed.*?-->/g, "{/* submit function removed - use /admin/td for demo operations */}");
fs.writeFileSync(f, t, "utf8");
console.log("HTML comments converted to JSX comments");
