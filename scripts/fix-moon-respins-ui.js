const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// 1) إضافة coinCount state بعد respins state
if (!t.includes("const [coinCount")) {
  t = t.replace(
    'const [respins, setRespins] = useState(3);',
    'const [respins, setRespins] = useState(3);\n  const [coinCount, setCoinCount] = useState(0);'
  );
}

// 2) حساب coinCount عند بدء Hold & Win
if (!t.includes("setCoinCount(")) {
  const countCoins = `
    const initialCoins = [];
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 3; r++) {
        const cell = grid[c]?.[r];
        if (cell && String(cell.sym).startsWith("c")) {
          initialCoins.push({ c, r, sym: cell.sym });
        }
      }
    }
    setCoinCount(initialCoins.length);`;
  
  t = t.replace(
    'setHwSteps(hw.steps);\n      setInHoldWin(true);\n      setRespins(3);',
    countCoins + '\n      setHwSteps(hw.steps);\n      setInHoldWin(true);\n      setRespins(3);'
  );
}

// 3) إضافة Prize Panels JSX قبل mm-stage
const prizePanels = `
      <div className="mm-prize-panels">
        <div className="mm-prize-item mini"><span>MINI</span><b>x20</b></div>
        <div className="mm-prize-item minor"><span>MINOR</span><b>x100</b></div>
        <div className="mm-prize-item major"><span>MAJOR</span><b>x500</b></div>
        <div className="mm-prize-item grand"><span>GRAND</span><b>x2000</b></div>
        <div className="mm-prize-item mythic"><span>MYTHIC</span><b>x5000</b></div>
      </div>`;

if (!t.includes("mm-prize-panels")) {
  t = t.replace(
    '<div className="mm-stage">',
    prizePanels + '\n      <div className="mm-stage">'
  );
}

// 4) إضافة Respins Circles + FILLED counter بعد mm-msg-bar
const respinsUI = `
      <div className="mm-respins-counter">
        <span>RESPINS:</span>
        <div className="mm-respins-dots">
          {[0, 1, 2].map(i => <div key={i} className={\`mm-dot \${i < respins ? "lit" : ""}\`}/>)}
        </div>
        <span className="mm-filled">FILLED {coinCount}/9</span>
      </div>`;

if (!t.includes("mm-respins-counter")) {
  t = t.replace(
    '<div className="mm-msg-bar">',
    respinsUI + '\n      <div className="mm-msg-bar">'
  );
}

fs.writeFileSync(f, t, "utf8");
console.log("Added respins dots, FILLED counter, prize panels");
