const fs = require("fs");
const f = "src/kb3/slots/falcon-dunes/FalconGame.tsx";
let t = fs.readFileSync(f, "utf8");

// 1) إضافة useBalance import
if (!t.includes('from "@/lib/balance-context"')) {
  t = t.replace(
    'import { sfx } from "../shared/sfx";',
    'import { sfx } from "../shared/sfx";\nimport { useBalance } from "@/lib/balance-context";'
  );
}

// 2) استبدال useState(1000) بـ useBalance
if (t.includes("const [bal, setBal] = useState(1000);")) {
  t = t.replace(
    "const [bal, setBal] = useState(1000);",
    'const { balance: bal, updateBalance } = useBalance();\n  const setBal = (fn: (b: number) => number) => { updateBalance(fn(bal) - bal); };'
  );
}

// 3) تبسيط رسالة الفوز
t = t.replace(/WIN \$\{win\.toFixed\(2\)\}/g, "WIN ${win.toFixed(2)} TD");
t = t.replace(/setMsg\("WIN " \+ win\.toFixed\(2\)\)/g, 'setMsg("WIN " + win.toFixed(2) + " TD")');

fs.writeFileSync(f, t, "utf8");
console.log("Falcon: balance unified, win message simplified");
