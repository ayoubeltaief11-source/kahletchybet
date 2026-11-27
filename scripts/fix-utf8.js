const fs = require("fs");
const f = "app/page.tsx";
let c = fs.readFileSync(f, "utf8");
const before = c;
c = c.replace(/â†’/g, "→").replace(/â€"/g, "—").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/â€™/g, "'").replace(/â€˜/g, "'").replace(/Ã©/g, "é").replace(/Ã /g, "à").replace(/Ã¨/g, "è");
if (c !== before) { fs.writeFileSync(f, c, "utf8"); console.log("Fixed UTF-8 in " + f); }
else console.log("Clean: " + f);
console.log("Line 69 now: " + c.split("\n")[68]);
