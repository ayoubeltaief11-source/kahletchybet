"use client";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let loopOsc: OscillatorNode | null = null;
let loopGain: GainNode | null = null;

function readMute(): boolean {
  try { return window.localStorage.getItem("kb3_mute") === "1"; } catch (e) { return false; }
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    muted = readMute();
    master.gain.value = muted ? 0 : 0.45;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay: number, slideTo?: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noise(dur: number, vol: number, delay: number, hp: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(t);
}

export const sfx = {
  unlock(): void { ac(); },
  isMuted(): boolean { return muted; },
  setMuted(m: boolean): void {
    muted = m;
    try { window.localStorage.setItem("kb3_mute", m ? "1" : "0"); } catch (e) { /* ignore */ }
    if (master) master.gain.value = m ? 0 : 0.45;
    if (m) sfx.spinStop();
  },
  toggleMute(): boolean { sfx.setMuted(!muted); return muted; },
  spinStart(): void {
    const c = ac();
    if (!c || !master || muted) return;
    sfx.spinStop();
    loopOsc = c.createOscillator();
    loopGain = c.createGain();
    loopOsc.type = "sawtooth";
    loopOsc.frequency.value = 92;
    loopGain.gain.value = 0.028;
    loopOsc.connect(loopGain);
    loopGain.connect(master);
    loopOsc.start();
    tone(180, 0.2, "sawtooth", 0.07, 0, 420);
  },
  spinStop(): void {
    if (loopOsc) { try { loopOsc.stop(); } catch (e) { /* stopped */ } loopOsc = null; }
    loopGain = null;
  },
  reelStop(i: number): void {
    const f = 440 * Math.pow(2, i / 24);
    tone(f, 0.07, "square", 0.11, 0);
    noise(0.03, 0.05, 0, 1400);
  },
  coinLand(): void { tone(1150, 0.06, "square", 0.09, 0); tone(1720, 0.09, "square", 0.07, 0.05); },
  pop(step: number): void { tone(320 * Math.pow(1.11, step), 0.09, "triangle", 0.16, 0); noise(0.04, 0.06, 0, 900); },
  anticipation(): void { tone(280, 1.0, "sine", 0.13, 0, 900); tone(420, 1.0, "sine", 0.09, 0.06, 1250); },
  win(tier: number): void {
    const sets = [[392, 494, 587], [440, 554, 659, 880], [523, 659, 784, 1046, 1318], [523, 659, 784, 1046, 1318, 1568]];
    const notes = sets[Math.max(0, Math.min(3, tier))];
    notes.forEach(function (f, i) { tone(f, 0.22, "triangle", 0.17, i * 0.085); });
    if (tier >= 2) notes.forEach(function (f, i) { tone(f * 2, 0.16, "sine", 0.08, i * 0.085 + 0.04); });
  },
  lose(): void { tone(240, 0.26, "sine", 0.07, 0, 150); },
  click(): void { tone(660, 0.04, "square", 0.06, 0); }
};
