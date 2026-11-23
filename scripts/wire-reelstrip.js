const fs = require('fs');
const f = 'components/kb2/slots/LineEngine.tsx';
let t = fs.readFileSync(f, 'utf8');
const before = t;

// 1) imports
const impAnchor = 'import { LineSym, LineMascot } from "./LineSym";';
const impAdd = '\nimport { ReelStrip } from "@/src/kb3/slots/ReelStrip";\nimport type { ReelStripHandle } from "@/src/kb3/slots/ReelStrip";\nimport { sfx } from "@/src/kb3/audio/sfx";';
if (t.includes(impAnchor) && !t.includes('ReelStrip')) {
  t = t.replace(impAnchor, impAnchor + impAdd);
}

// 2) refs + state after boardRef line
const refAnchor = '  const boardRef = useRef<HTMLDivElement>(null);';
const refAdd = '\n  const reelRefs = useRef<(ReelStripHandle | null)[]>([]);\n  const [reelDone, setReelDone] = useState(0);\n  const useStrip = slug === "neon-cherry-rush";';
if (t.includes(refAnchor) && !t.includes('reelRefs')) {
  t = t.replace(refAnchor, refAnchor + refAdd);
}

// 3) replace playRound opening to drive strips
const prOld = '  const playRound = useCallback(async function (r: SpinResult, turbo: boolean) {\n    const el = boardRef.current;\n    if (el) {\n      const cells = el.querySelectorAll("[data-c]");\n      gsap.fromTo(cells, { y: -40, opacity: 0.25 }, { y: 0, opacity: 1, duration: turbo ? 0.2 : 0.4, stagger: { each: 0.014, from: "start" }, ease: "back.out(1.4)" });\n    }\n    getAudio().reel();\n    await new Promise(function (res) { window.setTimeout(res, turbo ? 240 : 520); });';
const prNew = '  const playRound = useCallback(async function (r: SpinResult, turbo: boolean) {\n    setGrid(r.grid.slice());\n    if (useStrip) {\n      sfx.spinStart();\n      setReelDone(0);\n      const colsArr: number[][] = [];\n      for (let c = 0; c < REELS; c++) colsArr.push(r.grid.slice(c * rows, c * rows + rows));\n      const anticipate = (r.scatters || []).some(function (idx) { return idx < rows * 2; });\n      await Promise.all(colsArr.map(function (col, ci) {\n        const h = reelRefs.current[ci];\n        if (!h) return Promise.resolve();\n        return new Promise<void>(function (res) { window.setTimeout(function () { h.spin(col, ci, { turbo: turbo, anticipate: anticipate && ci >= 2 }).then(res); }, ci * (turbo ? 60 : 150)); });\n      }));\n      sfx.spinStop();\n    } else {\n      const el = boardRef.current;\n      if (el) {\n        const cells = el.querySelectorAll("[data-c]");\n        gsap.fromTo(cells, { y: -40, opacity: 0.25 }, { y: 0, opacity: 1, duration: turbo ? 0.2 : 0.4, stagger: { each: 0.014, from: "start" }, ease: "back.out(1.4)" });\n      }\n      getAudio().reel();\n      await new Promise(function (res) { window.setTimeout(res, turbo ? 240 : 520); });\n    }';
if (t.includes(prOld)) {
  t = t.replace(prOld, prNew);
} else {
  console.log('WARN: playRound anchor not matched exactly');
}

// 4) replace reel render block with conditional strip
const reelOld = '                  <div key={ci} className={"k6-reel" + (expand === ci ? " expanding" : "")}>\n                    {col.map(function (k, ri) {\n                      const i = ci * rows + ri;\n                      const on = lit.indexOf(i) >= 0;\n                      const onPath = path ? path[ci] === ri : false;\n                      return (\n                        <div key={ri} data-c={i} className={"k6-cell" + (on ? " lit" : "") + (onPath ? " path" : "")}>\n                          <LineSym k={k} set={cfg.set} size={54}/>\n                        </div>\n                      );\n                    })}\n                  </div>';
const reelNew = '                  useStrip ? (\n                    <ReelStrip key={ci} ref={function (h) { reelRefs.current[ci] = h; }} gameId={slug} rows={rows} initial={col} />\n                  ) : (\n                  <div key={ci} className={"k6-reel" + (expand === ci ? " expanding" : "")}>\n                    {col.map(function (k, ri) {\n                      const i = ci * rows + ri;\n                      const on = lit.indexOf(i) >= 0;\n                      const onPath = path ? path[ci] === ri : false;\n                      return (\n                        <div key={ri} data-c={i} className={"k6-cell" + (on ? " lit" : "") + (onPath ? " path" : "")}>\n                          <LineSym k={k} set={cfg.set} size={54}/>\n                        </div>\n                      );\n                    })}\n                  </div>\n                  )';
if (t.includes(reelOld)) {
  t = t.replace(reelOld, reelNew);
} else {
  console.log('WARN: reel render anchor not matched exactly');
}

fs.writeFileSync(f, t, 'utf8');
const after = fs.readFileSync(f, 'utf8');
console.log('changed=' + (after !== before));
console.log('has ReelStrip import=' + after.includes('import { ReelStrip }'));
console.log('has reelRefs=' + after.includes('reelRefs'));
console.log('has useStrip=' + after.includes('useStrip'));
console.log('has spinStart=' + after.includes('sfx.spinStart'));
console.log('braces balanced=' + ((after.match(/\{/g)||[]).length === (after.match(/\}/g)||[]).length));
console.log('parens balanced=' + ((after.match(/\(/g)||[]).length === (after.match(/\)/g)||[]).length));
