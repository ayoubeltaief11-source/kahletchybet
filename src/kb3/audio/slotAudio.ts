"use client";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio() { ac(); }
export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when: number, slideTo?: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, when: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = vol;
  const f = c.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = 900;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t);
}

export const slotAudio = {
  unlock: unlockAudio,
  reelTick: function (i: number) { tone(520 + i * 60, 0.07, "square", 0.12, 0); noise(0.03, 0.06, 0); },
  spinStart: function () { tone(180, 0.25, "sawtooth", 0.1, 0, 420); },
  anticipation: function () { tone(300, 0.9, "sine", 0.16, 0, 900); tone(450, 0.9, "sine", 0.1, 0.05, 1200); },
  pop: function (step: number) { tone(340 * Math.pow(1.12, step), 0.09, "triangle", 0.2, 0); noise(0.04, 0.08, 0); },
  coin: function () { tone(1200, 0.06, "square", 0.1, 0); tone(1800, 0.09, "square", 0.08, 0.05); },
  cash: function () { tone(880, 0.08, "square", 0.16, 0); tone(1320, 0.12, "square", 0.14, 0.07); tone(1760, 0.16, "square", 0.12, 0.15); },
  win: function (tier: number) {
    const base = tier >= 3 ? [523, 659, 784, 1046, 1318] : tier === 2 ? [440, 554, 659, 880] : [392, 494, 587];
    base.forEach(function (f, i) { tone(f, 0.22, "triangle", 0.2, i * 0.09); });
    if (tier >= 2) base.forEach(function (f, i) { tone(f * 2, 0.18, "sine", 0.1, i * 0.09 + 0.04); });
  },
  bust: function () { tone(220, 0.4, "sawtooth", 0.16, 0, 80); noise(0.3, 0.14, 0); }
};
