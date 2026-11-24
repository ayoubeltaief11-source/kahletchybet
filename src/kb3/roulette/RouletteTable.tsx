"use client";
import { useRef, useState } from "react";
import "./roulette.css";
import { getGame } from "../registry";
import type { BetType, RouletteVariant } from "./engine";
import { betKey, colorOf, columnNumbers, dozenNumbers, streetNumbers, lineNumbers, outsideNumbers } from "./engine";
import { CHIP_VALUES, CHIP_COLORS } from "./useRouletteBets";
import type { BetApi } from "./useRouletteBets";

interface Props {
  gameId: string;
  variant: RouletteVariant;
  balance: number;
  locked: boolean;
  message: string;
  highlight: string | null;
  lastWin: number;
  bets: BetApi;
  onSpin?: () => void;
  onAuto?: (n: number) => void;
  autoMode?: boolean;
}

function fa(n: number): string { return n % 1 === 0 ? String(n) : n.toFixed(2); }
function chipFor(amount: number): number {
  let v = 1;
  for (const c of CHIP_VALUES) if (c <= amount) v = c;
  return v;
}

export function ChipFace({ v, size }: { v: number; size?: number }) {
  const [ok, setOk] = useState(false);
  const s = size || 30;
  return (
    <span className={"rl-chip" + (ok ? " rl-chip-img" : "")} style={{ background: CHIP_COLORS[v] || "#888", width: s, height: s }}>
      <i className="rl-chipval" style={{ fontSize: Math.max(9, s * 0.34) }}>{v}</i>
      <img src={"/assets/roulette/chips/chip-" + v + ".png"} alt="" onLoad={function () { setOk(true); }} style={{ opacity: ok ? 1 : 0 }}/>
    </span>
  );
}

function Stack({ amount, small }: { amount: number; small?: boolean }) {
  if (amount <= 0) return null;
  return (
    <span className={small ? "rl-stack rl-stack-s" : "rl-stack"}>
      <ChipFace v={chipFor(amount)} size={small ? 16 : 24}/>
      <b>{fa(amount)}</b>
    </span>
  );
}

interface HS { type: BetType; numbers: string[]; left: number; top: number; label: string; }

export default function RouletteTable({ gameId, variant, balance, locked, message, highlight, lastWin, bets, onSpin, onAuto, autoMode }: Props) {
  const g = getGame(gameId);
  const rootRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const cellEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const trayEls = useRef<Record<number, HTMLButtonElement | null>>({});
  const [autoOpen, setAutoOpen] = useState(false);
  const amer = variant === "american";
  const feltName = gameId === "crimson-roulette" ? "crimson" : gameId === "royal-velvet" ? "velvet" : gameId === "midnight-wheel" ? "midnight" : gameId === "golden-crown" ? "golden" : "emerald";

  const hotspots: HS[] = [];
  for (let c = 0; c < 12; c++) {
    for (let r = 0; r < 3; r++) {
      const n = c * 3 + (3 - r);
      if (c < 11) hotspots.push({ type: "split", numbers: [String(n), String(n + 3)], left: ((c + 1) / 12) * 100, top: ((r + 0.5) / 3) * 100, label: n + "/" + (n + 3) });
      if (r < 2) hotspots.push({ type: "split", numbers: [String(n), String(n - 1)], left: ((c + 0.5) / 12) * 100, top: ((r + 1) / 3) * 100, label: n + "/" + (n - 1) });
      if (c < 11 && r < 2) hotspots.push({ type: "corner", numbers: [String(n), String(n - 1), String(n + 3), String(n + 2)], left: ((c + 1) / 12) * 100, top: ((r + 1) / 3) * 100, label: "Corner " + (n - 1) });
    }
    hotspots.push({ type: "street", numbers: streetNumbers(c), left: ((c + 0.5) / 12) * 100, top: 100, label: "Street " + (c * 3 + 1) });
    if (c < 11) hotspots.push({ type: "line", numbers: lineNumbers(c), left: ((c + 1) / 12) * 100, top: 100, label: "Line " + (c * 3 + 1) });
  }
  const zeroHS: HS[] = amer
    ? [
      { type: "split", numbers: ["0", "1"], left: 100, top: 16, label: "0/1" },
      { type: "split", numbers: ["0", "2"], left: 100, top: 40, label: "0/2" },
      { type: "split", numbers: ["0", "00"], left: 100, top: 50, label: "0/00" },
      { type: "split", numbers: ["00", "2"], left: 100, top: 62, label: "00/2" },
      { type: "split", numbers: ["00", "3"], left: 100, top: 86, label: "00/3" },
      { type: "basket", numbers: ["0", "00", "1", "2", "3"], left: 50, top: 100, label: "Basket" }
    ]
    : [
      { type: "split", numbers: ["0", "3"], left: 100, top: 16, label: "0/3" },
      { type: "split", numbers: ["0", "2"], left: 100, top: 50, label: "0/2" },
      { type: "split", numbers: ["0", "1"], left: 100, top: 84, label: "0/1" },
      { type: "corner", numbers: ["0", "1", "2", "3"], left: 100, top: 100, label: "0/1/2/3" }
    ];

  function fly(fromEl: HTMLElement | null, key: string) {
    const root = rootRef.current; const target = cellEls.current[key]; const layer = flyRef.current;
    if (!root || !fromEl || !target || !layer) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rr = root.getBoundingClientRect(); const fr = fromEl.getBoundingClientRect(); const tr = target.getBoundingClientRect();
    const el = document.createElement("span");
    el.className = "rl-flychip";
    el.style.background = CHIP_COLORS[bets.chip] || "#888";
    el.style.left = (fr.left - rr.left + fr.width / 2 - 14) + "px";
    el.style.top = (fr.top - rr.top + fr.height / 2 - 14) + "px";
    layer.appendChild(el);
    const dx = tr.left - fr.left + (tr.width - fr.width) / 2;
    const dy = tr.top - fr.top + (tr.height - fr.height) / 2;
    const anim = el.animate(
      [{ transform: "translate(0,0) scale(1)" }, { transform: "translate(" + dx + "px," + dy + "px) scale(0.75)" }],
      { duration: 240, easing: "cubic-bezier(.2,.8,.3,1)" }
    );
    anim.onfinish = function () { if (el.parentNode) el.parentNode.removeChild(el); };
  }

  function put(type: BetType, numbers: string[]) {
    const ok = bets.place(type, numbers);
    if (ok) fly(trayEls.current[bets.chip], type + ":" + betKey(numbers));
  }

  function reg(key: string) {
    return function (el: HTMLButtonElement | null) { cellEls.current[key] = el; };
  }
  function amt(type: BetType, numbers: string[]): number { return bets.amountOn(type, numbers); }
  const vars = { ["--rl-felt" as string]: g.color, ["--rl-acc" as string]: g.color2 };

  return (
    <div className="rl-table" style={vars} ref={rootRef}>
      <img className="rl-felt-tex" src={"/assets/roulette/felt-" + feltName + ".jpg"} alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
      <div className="rl-msg">{message}</div>
      <div className="rl-scroll">
        <div className="rl-layout">
          <div className="rl-zero">
            <button ref={reg("straight:0")} className={"rl-cell rl-green rl-zerocell" + (highlight === "0" ? " rl-hit" : "")} disabled={locked} onClick={function () { put("straight", ["0"]); }}>
              0<Stack amount={amt("straight", ["0"])}/>
            </button>
            {amer && (
              <button ref={reg("straight:00")} className={"rl-cell rl-green rl-zerocell" + (highlight === "00" ? " rl-hit" : "")} disabled={locked} onClick={function () { put("straight", ["00"]); }}>
                00<Stack amount={amt("straight", ["00"])}/>
              </button>
            )}
            {zeroHS.map(function (h, i) {
              const a = amt(h.type, h.numbers);
              return (
                <button key={"z" + i} ref={reg(h.type + ":" + betKey(h.numbers))} title={h.label} disabled={locked}
                  className={"rl-hs rl-zhs" + (a > 0 ? " rl-hs-on" : "")}
                  style={{ left: h.left + "%", top: h.top + "%" }}
                  onClick={function () { put(h.type, h.numbers); }}>
                  {a > 0 ? <Stack amount={a} small/> : <i>{h.label}</i>}
                </button>
              );
            })}
          </div>
          <div className="rl-gridwrap">
            <div className="rl-grid">
              {[0, 1, 2].map(function (r) {
                return Array.from({ length: 12 }, function (_, c) {
                  const n = c * 3 + (3 - r);
                  const col = colorOf(String(n));
                  const a = amt("straight", [String(n)]);
                  return (
                    <button key={n} ref={reg("straight:" + n)} disabled={locked}
                      className={"rl-cell " + (col === "red" ? "rl-red" : "rl-black") + (highlight === String(n) ? " rl-hit" : "")}
                      onClick={function () { put("straight", [String(n)]); }}>
                      {n}<Stack amount={a}/>
                    </button>
                  );
                });
              })}
              {hotspots.map(function (h, i) {
                const a = amt(h.type, h.numbers);
                return (
                  <button key={"h" + i} ref={reg(h.type + ":" + betKey(h.numbers))} title={h.label} disabled={locked}
                    className={"rl-hs" + (a > 0 ? " rl-hs-on" : "")}
                    style={{ left: h.left + "%", top: h.top + "%" }}
                    onClick={function () { put(h.type, h.numbers); }}>
                    {a > 0 ? <Stack amount={a} small/> : null}
                  </button>
                );
              })}
            </div>
            <div className="rl-dozens">
              {[1, 2, 3].map(function (d) {
                const nums = dozenNumbers(d);
                return (
                  <button key={d} ref={reg("dozen:" + betKey(nums))} className="rl-out" disabled={locked} onClick={function () { put("dozen", nums); }}>
                    {d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"}<Stack amount={amt("dozen", nums)}/>
                  </button>
                );
              })}
            </div>
            <div className="rl-outside">
              {(["low", "even", "red", "black", "odd", "high"] as const).map(function (k) {
                const nums = outsideNumbers(k);
                const label = k === "low" ? "1-18" : k === "high" ? "19-36" : k.toUpperCase();
                return (
                  <button key={k} ref={reg(k + ":" + betKey(nums))} className="rl-out" disabled={locked} onClick={function () { put(k, nums); }}>
                    {k === "red" || k === "black" ? <span className={"rl-diamond " + (k === "red" ? "rl-d-red" : "rl-d-black")}/> : label}
                    <Stack amount={amt(k, nums)}/>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rl-cols">
            {[3, 2, 1].map(function (col) {
              const nums = columnNumbers(col);
              return (
                <button key={col} ref={reg("column:" + betKey(nums))} className="rl-out rl-colbtn" disabled={locked} onClick={function () { put("column", nums); }}>
                  2:1<Stack amount={amt("column", nums)}/>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rl-bottom">
        <div className="rl-stats">
          <div><span>BALANCE</span><b>{balance.toFixed(2)} TD</b></div>
          <div><span>TOTAL BET</span><b>{bets.total.toFixed(2)} TD</b></div>
          <div><span>LAST WIN</span><b className={lastWin > 0 ? "rl-up" : ""}>{lastWin.toFixed(2)} TD</b></div>
        </div>
        <div className="rl-tray">
          {CHIP_VALUES.map(function (v) {
            return (
              <button key={v} ref={function (el) { trayEls.current[v] = el; }} disabled={locked}
                className={"rl-traybtn" + (bets.chip === v ? " rl-sel" : "")}
                onClick={function () { bets.setChip(v); }}>
                <ChipFace v={v} size={42}/>
              </button>
            );
          })}
        </div>
        <div className="rl-controls">
          <button className="rl-btn" disabled={locked} onClick={bets.undo}>UNDO</button>
          <button className="rl-btn" disabled={locked} onClick={bets.clear}>CLEAR</button>
          <button className="rl-btn" disabled={locked} onClick={bets.rebet}>REBET</button>
          <button className="rl-btn" disabled={locked} onClick={bets.double}>x2</button>
          {!autoMode && <button className="rl-btn" disabled={locked} onClick={function () { setAutoOpen(!autoOpen); }}>AUTO</button>}
          {!autoMode && <button className="rl-spin" disabled={!bets.canSpin} onClick={onSpin}>{locked ? "..." : "SPIN"}</button>}
          {autoMode && <span className="rl-autolabel">AUTO ROUND</span>}
        </div>
        {autoOpen && (
          <div className="rl-autopop">
            {[10, 25, 50, 100].map(function (n) {
              return <button key={n} className="rl-btn" onClick={function () { setAutoOpen(false); if (onAuto) onAuto(n); }}>{n} SPINS</button>;
            })}
          </div>
        )}
      </div>
      <div className="rl-fly" ref={flyRef}/>
    </div>
  );
}
