"use client";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let engOsc: OscillatorNode | null = null;
let engOsc2: OscillatorNode | null = null;
let engGain: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    try { muted = window.localStorage.getItem("kb3_crash_mute") === "1"; } catch (e) { muted = false; }
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
function tone(f: number, dur: number, type: OscillatorType, vol: number, delay: number, slide?: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur: number, vol: number, lp: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(master);
  s.start();
}
export const crashSfx = {
  unlock(): void { ac(); },
  isMuted(): boolean { return muted; },
  toggleMute(): boolean {
    muted = !muted;
    try { window.localStorage.setItem("kb3_crash_mute", muted ? "1" : "0"); } catch (e) { /* ignore */ }
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (muted) crashSfx.engine(0);
    return muted;
  },
  engine(m: number): void {
    const c = ac();
    if (!c || !master) return;
    if (m <= 0 || muted) {
      if (engOsc) { try { engOsc.stop(); } catch (e) { /* stopped */ } engOsc = null; }
      if (engOsc2) { try { engOsc2.stop(); } catch (e) { /* stopped */ } engOsc2 = null; }
      engGain = null;
      return;
    }
    if (!engOsc) {
      engGain = c.createGain(); engGain.gain.value = 0.04;
      engOsc = c.createOscillator(); engOsc.type = "sawtooth"; engOsc.frequency.value = 70;
      engOsc2 = c.createOscillator(); engOsc2.type = "triangle"; engOsc2.frequency.value = 140;
      engOsc.connect(engGain); engOsc2.connect(engGain); engGain.connect(master);
      engOsc.start(); engOsc2.start();
    }
    const f = 70 + Math.min(180, (m - 1) * 14);
    engOsc.frequency.setTargetAtTime(f, c.currentTime, 0.15);
    if (engOsc2) engOsc2.frequency.setTargetAtTime(f * 2, c.currentTime, 0.15);
    if (engGain) engGain.gain.setTargetAtTime(0.03 + Math.min(0.05, (m - 1) * 0.006), c.currentTime, 0.2);
  },
  pulse(): void { tone(880, 0.07, "square", 0.08, 0); },
  boom(): void { noise(0.5, 0.35, 900); tone(180, 0.5, "sine", 0.25, 0, 40); },
  kaching(): void { tone(1568, 0.12, "triangle", 0.14, 0); tone(2093, 0.18, "triangle", 0.12, 0.07); noise(0.05, 0.08, 4000); },
  count(): void { tone(660, 0.06, "square", 0.09, 0); }
};
