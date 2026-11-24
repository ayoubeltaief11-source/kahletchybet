const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.replace('      <img ref={craftRef} className="rcs-craft" src={craftSrc} alt="" onLoad={function () { setImgOk(true); }} style={{ opacity: 0 }}/>', '      <img ref={craftRef} className="rcs-craft" src={craftSrc} alt="" onLoad={function () { setImgOk(true); }} style={{ opacity: 0, width: "16%" }}/>');
t = t.replace('{phase === "crashed" && <div className="rcs-crashed">CRASHED @ {m.toFixed(2)}x</div>}', '{phase === "crashed" && <div className="rcs-crashed"><b>CRASHED</b><strong>{m.toFixed(2)}x</strong></div>}');
fs.writeFileSync(f, t, "utf8");
console.log("craft 16%: " + t.includes('width: "16%"'));
console.log("crash red: " + t.includes("<strong>{m.toFixed(2)}x</strong>"));
