const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// 1) إصلاح استيراد useBalance
t = t.replace(
  'const { balance: bal, updateBalance: setBal } = useBalance();',
  'const { balance: bal, updateBalance } = useBalance();\n  const setBal = (fn: (b: number) => number) => { updateBalance(fn(bal) - bal); };'
);

// 2) إصلاح spin(false) -> spin()
t = t.replace(/spin\(false\)/g, 'spin()');

fs.writeFileSync(f, t, "utf8");
console.log("Fixed useBalance destructuring and spin() calls");
