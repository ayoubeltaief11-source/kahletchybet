"use client";
import { useState } from "react";
import { REDS } from "@/lib/kb2/rouletteMath";

const CHIPS = [
  { v: 1, c: "#e8e8e8", t: "#1a1a1a" },
  { v: 2, c: "#3b82f6", t: "#fff" },
  { v: 5, c: "#22c55e", t: "#fff" },
  { v: 10, c: "#ef4444", t: "#fff" },
  { v: 25, c: "#a855f7", t: "#fff" },
  { v: 50, c: "#f97316", t: "#fff" },
  { v: 100, c: "#eab308", t: "#1a1a00" }
];

const OUTSIDE = [
  { k: "red", l: "RED" }, { k: "black", l: "BLACK" },
  { k: "even", l: "EVEN" }, { k: "odd", l: "ODD" },
  { k: "low", l: "1-18" }, { k: "high", l: "19-36" },
  { k: "d1", l: "1st 12" }, { k: "d2", l: "2nd 12" }, { k: "d3", l: "3rd 12" },
  { k: "c1", l: "2:1" }, { k: "c2", l: "2:1" }, { k: "c3", l: "2:1" }
];

interface Props {
  bets: Record<string, number>;
  chip: number;
  spinning: boolean;
  lastNumber: number | null;
  onBet: (key: string) => void;
  onChip: (v: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onRebet: () => void;
  onDouble: () => void;
}

export default function TablePro({ bets, chip, spinning, lastNumber, onBet, onChip, onUndo, onClear, onRebet, onDouble }: Props) {
  const rows = [
    [3,6,9,12,15,18,21,24,27,30,33,36],
    [2,5,8,11,14,17,20,23,26,29,32,35],
    [1,4,7,10,13,16,19,22,25,28,31,34]
  ];

  return (
    <div className="kp-table">
      <div className="kp-felt">
        {/* Zero column */}
        <div className="kp-zeros">
          <button className={"kp-z" + (lastNumber === 0 ? " hit" : "")} disabled={spinning} onClick={function(){onBet("n0")}}>0{bets["n0"] ? <span className="kp-stack"><i>{bets["n0"]}</i></span> : null}</button>
        </div>
        {/* Number grid */}
        <div className="kp-grid">
          {rows.map(function(row, ri) {
            return (
              <div key={ri} className="kp-row">
                {row.map(function(n) {
                  const k = "n" + n;
                  const isR = REDS.indexOf(n) >= 0;
                  return (
                    <button key={n} className={"kp-n " + (isR ? "r" : "b") + (lastNumber === n ? " hit" : "") + (bets[k] ? " on" : "")} disabled={spinning} onClick={function(){onBet(k)}}>
                      {n}
                      {bets[k] ? <span className="kp-chip-sm" style={{background: CHIPS.find(function(c){return c.v===chip;})?.c || "#e8e8e8"}}><i>{bets[k]}</i></span> : null}
                    </button>
                  );
                })}
                <button className={"kp-col " + (bets["c"+(ri+1)] ? "on" : "") + (lastNumber && row.indexOf(lastNumber)>=0 ? " hit" : "")} disabled={spinning} onClick={function(){onBet("c"+(ri+1))}}>2:1{bets["c"+(ri+1)] ? <span className="kp-chip-sm"><i>{bets["c"+(ri+1)]}</i></span> : null}</button>
              </div>
            );
          })}
        </div>
        {/* Outside bets */}
        <div className="kp-outs">
          {OUTSIDE.slice(0,9).map(function(o) {
            return <button key={o.k} className={"kp-out" + (bets[o.k] ? " on" : "")} disabled={spinning} onClick={function(){onBet(o.k)}}>{o.l}{bets[o.k] ? <span className="kp-chip-sm"><i>{bets[o.k]}</i></span> : null}</button>;
          })}
        </div>
      </div>
      {/* Chip tray + controls */}
      <div className="kp-tray">
        {CHIPS.map(function(ch) {
          return <button key={ch.v} className={"kp-tchip" + (chip===ch.v ? " sel" : "")} style={{background: "radial-gradient(circle at 35% 30%,"+ch.c+","+ch.c+" 60%,#000 100%)"}} onClick={function(){onChip(ch.v)}}>{ch.v}</button>;
        })}
        <div className="kp-btns">
          <button className="kp-btn" onClick={onUndo} disabled={spinning}>UNDO</button>
          <button className="kp-btn" onClick={onClear} disabled={spinning}>CLEAR</button>
          <button className="kp-btn" onClick={onRebet} disabled={spinning}>REBET</button>
          <button className="kp-btn gold" onClick={onDouble} disabled={spinning}>DOUBLE</button>
        </div>
      </div>
    </div>
  );
}
