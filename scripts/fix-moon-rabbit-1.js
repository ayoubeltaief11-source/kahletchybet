const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// 1) استيراد useBalance
if (!t.includes("useBalance")) {
  t = t.replace(
    'import { sfx } from "../shared/sfx";',
    'import { sfx } from "../shared/sfx";\nimport { useBalance } from "@/lib/balance-context";'
  );
}

// 2) استبدال useState(1000) بـ useBalance()
t = t.replace(
  'const [bal, setBal] = useState(1000);',
  'const { balance: bal, updateBalance: setBal } = useBalance();'
);

// 3) إضافة rabbit state بعد intro state
if (!t.includes("rabbitJump")) {
  t = t.replace(
    'const [intro, setIntro] = useState(true);',
    'const [intro, setIntro] = useState(true);\n  const [rabbitJump, setRabbitJump] = useState(false);\n  const [rabbitHammer, setRabbitHammer] = useState(false);'
  );
}

// 4) إضافة timeout protection في animateHoldWin
const oldAnimateStart = 'const animateHoldWin = useCallback(async () => {';
const newAnimateStart = 'const animateHoldWin = useCallback(async () => {\n    const timeout = setTimeout(() => {\n      setInHoldWin(false);\n      setMsg("HOLD & WIN TIMEOUT");\n      spinRef.current = false;\n      setSpinning(false);\n    }, 30000);';
t = t.replace(oldAnimateStart, newAnimateStart);

// 5) إضافة clearTimeout عند الانتهاء
const oldAnimateEnd = 'setInHoldWin(false);\n    spinRef.current = false; setSpinning(false);\n  }, [hwSteps, bet]);';
const newAnimateEnd = 'clearTimeout(timeout);\n    setInHoldWin(false);\n    spinRef.current = false; setSpinning(false);\n  }, [hwSteps, bet]);';
t = t.replace(oldAnimateEnd, newAnimateEnd);

// 6) إضافة rabbit jump على الفوز الكبير
const oldBigWin = 'if (total >= bet * 15) { setBigWin({ amt: total, mult: total / bet }); sfx.fanfare(); }';
const newBigWin = 'if (total >= bet * 15) { setBigWin({ amt: total, mult: total / bet }); sfx.fanfare(); setRabbitJump(true); setTimeout(() => setRabbitJump(false), 1000); }';
t = t.replace(oldBigWin, newBigWin);

// 7) إضافة rabbit hammer عند نزول عملة
const oldCoinDrop = 'sfx.chime();';
const newCoinDrop = 'sfx.chime(); setRabbitHammer(true); setTimeout(() => setRabbitHammer(false), 200);';
t = t.replace(oldCoinDrop, newCoinDrop);

fs.writeFileSync(f, t, "utf8");
console.log("MoonGame: balance unified, rabbit added, Hold&Win timeout added");
