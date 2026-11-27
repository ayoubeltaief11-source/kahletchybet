const fs = require("fs");
const f = "app/wallet/page.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.replace(/me\.credits/g, "me.balance");
fs.writeFileSync(f, t, "utf8");
console.log("Fixed me.credits -> me.balance");
