const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
let t = fs.readFileSync(f, "utf8");
const R = [
  ['import "./atlas.css";', 'import "./atlas.css";\nimport { atlasSfx } from "./sfx";'],
  ['  const multRef = useRef<HTMLSpanElement>(null);', '  const multRef = useRef<HTMLSpanElement>(null);\n  const charRef = useRef<HTMLDivElement>(null);'],
  ['        <aside className="at-char"><div className="at-atlas">🗿</div></aside>', '        <aside className="at-char">\n          <div className="at-atlas" ref={charRef}>\n            <span className="at-charfallback">🗿</span>\n            <img className="at-charimg" src="/assets/atlas-skyfall/character.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }} style={{ opacity: spinning ? 0 : 1 }}/>\n            <img className="at-charimg" src="/assets/atlas-skyfall/character-cast.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }} style={{ opacity: spinning ? 1 : 0 }}/>\n          </div>\n        </aside>'],
  ['          <div className="at-msg">{msg}</div>', '          <img className="at-frame" src="/assets/atlas-skyfall/frame.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>\n          <div className="at-msg">{msg}</div>'],
  ['setMsg(isFree ? "FREE SPIN" : "GOOD LUCK");', 'setMsg(isFree ? "FREE SPIN" : "GOOD LUCK"); atlasSfx.spin();'],
  ['      spawnSparks(winEls);', '      spawnSparks(winEls); atlasSfx.pop(i);'],
  ['onComplete: function () { b.remove(); gsap.fromTo(target, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }); }', 'onComplete: function () { b.remove(); atlasSfx.chime(); gsap.fromTo(target, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }); }'],
  ['onComplete: function () { gsap.set(cc, { scale: 1 }); res(); }', 'onComplete: function () { gsap.set(cc, { scale: 1 }); atlasSfx.tick(c); res(); }'],
  ['if (total >= betRef.current * 15) { setBigWin({ amt: total, mult: total / betRef.current }); coinRain(); }', 'if (total >= betRef.current * 15) { setBigWin({ amt: total, mult: total / betRef.current }); coinRain(); atlasSfx.fanfare(); }'],
  ['if (res.scatterCount >= 4) { setInFree(true); setFsLeft(15); setFsMult(0); setFsTotal(0); setMsg("15 FREE SPINS WON"); }', 'if (res.scatterCount >= 4) { setInFree(true); setFsLeft(15); setFsMult(0); setFsTotal(0); setMsg("15 FREE SPINS WON"); atlasSfx.free(); }'],
  ['  const buyFeature = useCallback(function () {', '  useEffect(function () { const el = charRef.current; if (!el) return; if (spinning) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: 0.3, yoyo: true, repeat: 1 }); }, [spinning]);\n  useEffect(function () { const el = charRef.current; if (!el || mult <= 0) return; gsap.fromTo(el, { filter: "brightness(1)" }, { filter: "brightness(1.8)", duration: 0.2, yoyo: true, repeat: 1 }); }, [mult]);\n  useEffect(function () { const el = charRef.current; if (!el || (!bigWin && !inFree)) return; gsap.fromTo(el, { y: 0 }, { y: -24, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" }); }, [bigWin, inFree]);\n\n  const buyFeature = useCallback(function () {']
];
for (const [a, b] of R) { if (t.includes(a)) t = t.split(a).join(b); else console.log("MISS: " + a.slice(0, 50)); }
fs.writeFileSync(f, t, "utf8");
console.log("character+sound+frame wired");
