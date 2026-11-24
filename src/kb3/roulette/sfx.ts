"use client";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let loopOsc: OscillatorNode | null = null;
let loopOsc2: OscillatorNode | null = null;
let loopGain: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    try { muted = window.localStorage.getItem("kb3_rl_mute") === "1"; } catch (e) { muted = false; }
    master.gain.value = muted ? 0 : 0.5;
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
  g.gain.linearRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.03);
}

function noise(dur: number, vol: number, hp: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(master);
  s.start();
}

export const rlSfx = {
  unlock(): void { ac(); },
  isMuted(): boolean { return muted; },
  toggleMute(): boolean {
    muted = !muted;
    try { window.localStorage.setItem("kb3_rl_mute", muted ? "1" : "0"); } catch (e) { /* ignore */ }
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (muted) rlSfx.spinStop();
    return muted;
  },
  spinStart(): void {
    const c = ac();
    if (!c || !master || muted) return;
    rlSfx.spinStop();
    loopGain = c.createGain(); loopGain.gain.value = 0.035;
    loopOsc = c.createOscillator(); loopOsc.type = "sawtooth"; loopOsc.frequency.value = 62;
    loopOsc2 = c.createOscillator(); loopOsc2.type = "triangle"; loopOsc2.frequency.value = 124;
    loopOsc.connect(loopGain); loopOsc2.connect(loopGain); loopGain.connect(master);
    loopOsc.start(); loopOsc2.start();
  },
  spinStop(): void {
    if (loopOsc) { try { loopOsc.stop(); } catch (e) { /* stopped */ } loopOsc = null; }
    if (loopOsc2) { try { loopOsc2.stop(); } catch (e) { /* stopped */ } loopOsc2 = null; }
    loopGain = null;
  },
  tick(speed01: number): void { tone(1500 + speed01 * 900, 0.03, "square", 0.05 + speed01 * 0.07, 0); },
  bounce(): void { tone(320, 0.07, "sine", 0.14, 0, 180); noise(0.04, 0.06, 900); },
  settle(): void { tone(900, 0.05, "square", 0.1, 0); tone(600, 0.09, "square", 0.09, 0.07); tone(240, 0.2, "sine", 0.1, 0.12); },
  chip(): void { tone(1250, 0.04, "square", 0.07, 0); tone(1800, 0.05, "square", 0.05, 0.03); },
  win(big: boolean): void {
    const notes = big ? [523, 659, 784, 1046, 1318] : [440, 554, 659];
    notes.forEach(function (f, i) { tone(f, 0.22, "triangle", 0.16, i * 0.09); });
    if (big) notes.forEach(function (f, i) { tone(f * 2, 0.16, "sine", 0.07, i * 0.09 + 0.04); });
  },
  lose(): void { tone(260, 0.25, "sine", 0.07, 0, 150); },
  count(): void { tone(880, 0.06, "square", 0.08, 0); }
};
