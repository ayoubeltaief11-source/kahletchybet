const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// إضافة الأرنب بجانب الشبكة (قبل mm-frame)
const rabbitJSX = `
      <div className={\`mm-rabbit \${rabbitJump ? "jump" : ""} \${rabbitHammer ? "hammer" : ""}\`}>
        <img src={A + "rabbit.png"} alt="Moon Rabbit" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
      </div>`;

if (!t.includes("mm-rabbit")) {
  t = t.replace(
    '<div className="mm-frame">',
    rabbitJSX + '\n      <div className="mm-frame">'
  );
}

// إصلاح عرض الشبكة لإظهار 9 خانات دائماً
const oldGridRender = '{(inHoldWin ? hwSteps[hwStepIdx]?.grid : grid).map((col, c) => \n                (inHoldWin ? col : col).map((cell, r) => \n                  cell && <div key={c + "-" + r} className="mm-cell" data-c={c} data-r={r}><SymImg cell={cell as Cell}/></div>\n                )\n              )}';
const newGridRender = '{Array(3).fill(null).map((_, c) => Array(3).fill(null).map((_, r) => {\n                const cell = inHoldWin ? (hwSteps[hwStepIdx]?.grid?.[c]?.[r] || null) : grid[c]?.[r];\n                return <div key={c + "-" + r} className="mm-cell" data-c={c} data-r={r}>{cell ? <SymImg cell={cell as Cell}/> : <div className="mm-cell-empty"/>}</div>;\n              }))}';

if (t.includes("cell && <div key={c + \"-\" + r}")) {
  t = t.replace(/cell && <div key=\{c \+ "-" \+ r\}[\s\S]*?<\/div>\s*\)\s*\)/, newGridRender);
  console.log("Grid render fixed to show 9 cells always");
} else {
  console.log("Grid pattern not found, manual check needed");
}

fs.writeFileSync(f, t, "utf8");
console.log("Rabbit added to UI, grid fixed");
