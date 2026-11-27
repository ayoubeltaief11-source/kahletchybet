const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");
// إصلاح القوس الزائد
t = t.replace("}))}}", "}))}");
fs.writeFileSync(f, t, "utf8");
console.log("Fixed extra closing brace in MoonGame.tsx line 235");
