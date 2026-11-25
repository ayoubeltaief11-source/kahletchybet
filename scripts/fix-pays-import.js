const fs = require("fs");
const f = "src/kb3/slots/falcon-dunes/FalconGame.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.replace('import { makeGrid, mulberry32, REEL_WEIGHTS, evaluateRound, FS_MODES } from "./engine";', 'import { makeGrid, mulberry32, REEL_WEIGHTS, evaluateRound, FS_MODES, PAYS } from "./engine";');
fs.writeFileSync(f, t, "utf8");
console.log("PAYS import fixed: " + t.includes("PAYS } from"));
