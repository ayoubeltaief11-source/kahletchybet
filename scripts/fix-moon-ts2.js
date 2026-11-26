const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");
const R = [
  ["export default function MoonGame() {", "export default function MoonGame({ debug }: { debug?: boolean }) {"],
  ["const [strips, setStrips] = useState<Cell[][][]>([]);", "const [strips, setStrips] = useState<Cell[][]>([]);"],
  ["      {bigWin && (", "      {debug && (\n        <div className=\"mm-panel\">\n          <b>DEBUG - IMAGE STATUS</b>\n          <div className=\"mm-panel-grid\">\n            {[\"symbols/s1.png\",\"symbols/s2.png\",\"symbols/s3.png\",\"symbols/s4.png\",\"symbols/s5.png\",\"symbols/s6.png\",\"symbols/mystery.png\",\"coins/coin-bronze.png\",\"coins/coin-silver.png\",\"coins/coin-gold.png\",\"coins/coin-jade.png\",\"coins/coin-mythic.png\",\"rabbit.png\",\"lantern.png\",\"corner.png\",\"logo.png\",\"cover.png\",\"bg.jpg\",\"feature-bg.jpg\",\"fx/spark.png\",\"fx/glow.png\",\"fx/flash.png\",\"fx/ring.png\",\"fx/moondust.png\"].map(function (u) {\n              const [ok, setOk] = useState<boolean | null>(null);\n              useEffect(function () { const im = new Image(); im.onload = function () { setOk(true); }; im.onerror = function () { setOk(false); }; im.src = A + u; }, []);\n              return <span key={u} className={ok === false ? \"bad\" : ok === true ? \"good\" : \"\"}>{(ok === false ? \"MISSING \" : ok === true ? \"OK \" : \"... \") + u}</span>;\n            })}\n          </div>\n        </div>\n      )}\n      {bigWin && ("]
];
let miss = 0;
for (const [a, b] of R) { if (t.includes(a)) t = t.split(a).join(b); else { miss++; console.log("MISS: " + a.slice(0, 50)); } }
fs.writeFileSync(f, t, "utf8");
console.log("fixes applied, misses=" + miss);
