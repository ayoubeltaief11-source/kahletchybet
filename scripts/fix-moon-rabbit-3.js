const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// إضافة AUTO state
if (!t.includes("autoLeft")) {
  t = t.replace(
    'const [intro, setIntro] = useState(true);',
    'const [intro, setIntro] = useState(true);\n  const [autoLeft, setAutoLeft] = useState(0);'
  );
}

// إضافة AUTO effect
if (!t.includes("autoLeft <= 0")) {
  const autoEffect = `
  useEffect(() => {
    if (autoLeft <= 0 || spinning || inHoldWin || bigWin) return;
    const tt = setTimeout(() => {
      setAutoLeft(a => a - 1);
      spin(false);
    }, 700);
    return () => clearTimeout(tt);
  }, [autoLeft, spinning, inHoldWin, bigWin]);`;
  t = t.replace('}, []);', '}, []);\n' + autoEffect);
}

// استبدال Footer القديم
const oldFooter = '<footer className="mm-foot">[\s\S]*?</footer>';
const newFooter = `<footer className="mm-foot">
        <div className="mm-bet-panel">
          <button onClick={() => setBet(Math.max(1, bet - 5))}>-</button>
          <span>{bet.toFixed(2)}</span>
          <button onClick={() => setBet(bet + 5)}>+</button>
        </div>
        <button className="mm-spin" onClick={() => void spin(inHoldWin)}>{spinning ? "STOP" : "SPIN"}</button>
        <div className="mm-controls">
          <button className="mm-turbo" onClick={() => setTurbo(!turbo)}>{turbo ? "TURBO ON" : "TURBO"}</button>
          <button className="mm-auto" onClick={() => setAutoLeft(autoLeft > 0 ? 0 : 10)}>{autoLeft > 0 ? "AUTO " + autoLeft : "AUTO"}</button>
        </div>
      </footer>`;

// استبدال Mystery/Buy بأزرار أكبر مع تأكيد
const oldMysteryBuy = '<button className={"mm-mystery-btn" + (mysteryMode ? " on" : "")} disabled={spinning || inHoldWin} onClick={() => setMysteryMode(!mysteryMode)}>MYSTERY +50%</button>\n          <button className="mm-buy-btn" disabled={spinning || inHoldWin} onClick={buyFeature}>BUY x60</button>';
const newMysteryBuy = `<button className={"mm-mystery-btn" + (mysteryMode ? " on" : "")} disabled={spinning || inHoldWin} onClick={() => { if (mysteryMode) setMysteryMode(false); else if (confirm("Enable Mystery Mode for +50% bet cost?")) setMysteryMode(true); }}>
            <span className="mm-btn-icon">🌙</span><span>MYSTERY</span>
          </button>
          <button className="mm-buy-btn" disabled={spinning || inHoldWin} onClick={() => { if (confirm("Buy Bonus for " + (bet * 60).toFixed(2) + " TD?")) buyFeature(); }}>
            <span className="mm-btn-icon">🎁</span><span>BUY x60</span>
          </button>`;

if (t.includes("MYSTERY +50%")) {
  t = t.replace(oldMysteryBuy, newMysteryBuy);
  console.log("Mystery/Buy buttons enhanced with icons and confirmation");
}

// استبدال mm-bal بـ stacked layout
const oldBal = '<div className="mm-bal"><span>BALANCE</span><b>{bal.toFixed(2)}</b></div>';
const newBal = '<div className="mm-bal"><span className="mm-bal-label">BALANCE</span><b className="mm-bal-value">{bal.toFixed(2)}</b></div>';
t = t.replace(oldBal, newBal);

fs.writeFileSync(f, t, "utf8");
console.log("Footer redesigned, AUTO added, Mystery/Buy enhanced");
