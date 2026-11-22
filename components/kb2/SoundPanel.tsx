"use client";
import { useCallback, useEffect, useState } from "react";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";
import { AMBIENT } from "@/lib/kb2/ambient";

const DEMOS: [string, string][] = [
  ["click", "Click"], ["chip", "Chip"], ["reel", "Reel stop"], ["tumble", "Tumble"],
  ["scatter", "Scatter"], ["count", "Countdown"], ["launch", "Launch"], ["win", "Win small"],
  ["big", "Win big"], ["mega", "Win mega"], ["cash", "Cashout"], ["lose", "Loss"],
  ["bust", "Crash bust"], ["boom", "Mine boom"], ["dice", "Dice"], ["card", "Card"],
  ["safe", "Gem safe"], ["ball", "Roulette ball"], ["warn", "Warning"]
];

export default function SoundPanel() {
  const { p, update } = usePrefs();
  const [open, setOpen] = useState(false);
  const [amb, setAmb] = useState("off");
  const [humOn, setHumOn] = useState(false);
  const [mult, setMult] = useState(1);

  useEffect(function () {
    const a = getAudio();
    a.setLevels(p.master, p.music, p.sfx, !p.sound);
  }, [p.master, p.music, p.sfx, p.sound]);

  useEffect(function () {
    return function () { getAudio().stopAll(); };
  }, []);

  const fire = useCallback(function (name: string) {
    const a = getAudio();
    a.unlock();
    if (name === "count") { a.count(3); window.setTimeout(function () { a.count(2); }, 420); window.setTimeout(function () { a.count(1); }, 840); return; }
    const fn = (a as unknown as Record<string, unknown>)[name];
    if (typeof fn === "function") (fn as () => void).call(a);
  }, []);

  const setAmbient = useCallback(function (k: string) {
    const a = getAudio();
    a.unlock();
    setAmb(k);
    a.ambient(k === "off" ? null : k);
  }, []);

  const toggleHum = useCallback(function () {
    const a = getAudio();
    a.unlock();
    const next = !humOn;
    setHumOn(next);
    a.hum(next);
    if (next) a.humLevel(mult); else a.riseStop();
  }, [humOn, mult]);

  const moveMult = useCallback(function (v: number) {
    setMult(v);
    const a = getAudio();
    if (humOn) { a.humLevel(v); a.rise(v); }
  }, [humOn]);

  return (
    <div className={"kb2-snd" + (open ? " open" : "")}>
      <button className="kb2-snd-fab" onClick={function () { getAudio().unlock(); setOpen(function (v) { return !v; }); }} title="Sound studio">
        <span className="kb2-snd-ico">{p.sound ? "SND" : "MUTE"}</span>
        {open && <span className="kb2-snd-close">x</span>}
      </button>
      {open && (
        <div className="kb2-snd-box">
          <div className="kb2-snd-head">
            <b>SOUND STUDIO</b>
            <span className="kb2-demo">Demo - no real money</span>
          </div>
          <label className="kb2-sl">
            <span>Master</span>
            <input type="range" min={0} max={100} value={Math.round(p.master * 100)} onChange={function (e) { update({ master: Number(e.target.value) / 100 }); }}/>
            <em>{Math.round(p.master * 100)}</em>
          </label>
          <label className="kb2-sl">
            <span>Music</span>
            <input type="range" min={0} max={100} value={Math.round(p.music * 100)} onChange={function (e) { update({ music: Number(e.target.value) / 100 }); }}/>
            <em>{Math.round(p.music * 100)}</em>
          </label>
          <label className="kb2-sl">
            <span>Effects</span>
            <input type="range" min={0} max={100} value={Math.round(p.sfx * 100)} onChange={function (e) { update({ sfx: Number(e.target.value) / 100 }); }}/>
            <em>{Math.round(p.sfx * 100)}</em>
          </label>
          <button className={"kb2-mute" + (p.sound ? "" : " off")} onClick={function () { update({ sound: !p.sound }); }}>{p.sound ? "SOUND ON" : "MUTED"}</button>
          <div className="kb2-snd-sec">AMBIENT BED</div>
          <div className="kb2-snd-row">
            <button className={amb === "off" ? "on" : ""} onClick={function () { setAmbient("off"); }}>OFF</button>
            {Object.keys(AMBIENT).map(function (k) {
              return <button key={k} className={amb === k ? "on" : ""} onClick={function () { setAmbient(k); }}>{k.toUpperCase()}</button>;
            })}
          </div>
          <div className="kb2-snd-sec">CRASH ENGINE</div>
          <button className={"kb2-mute" + (humOn ? " hum" : "")} onClick={toggleHum}>{humOn ? "ENGINE RUNNING" : "START ENGINE"}</button>
          <label className="kb2-sl">
            <span>Multiplier</span>
            <input type="range" min={100} max={900} value={Math.round(mult * 100)} disabled={!humOn} onChange={function (e) { moveMult(Number(e.target.value) / 100); }}/>
            <em>{mult.toFixed(2)}x</em>
          </label>
          <div className="kb2-snd-sec">TEST EFFECTS</div>
          <div className="kb2-snd-grid">
            {DEMOS.map(function (d) {
              return <button key={d[0]} onClick={function () { fire(d[0]); }}>{d[1]}</button>;
            })}
          </div>
          <p className="kb2-snd-note">Every sound is synthesized live with the Web Audio API. No audio files are loaded.</p>
        </div>
      )}
    </div>
  );
}
