const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/engine.ts";
let t = fs.readFileSync(f, "utf8");
// Fix the type assignment error
t = t.replace("let newSym: CoinId = cell.sym;", "let newSym: CoinId = (typeof cell.sym === 'string' && cell.sym.startsWith('c')) ? cell.sym as CoinId : 'c5';");
fs.writeFileSync(f, t, "utf8");
console.log("TypeScript CoinId assignment fixed");
