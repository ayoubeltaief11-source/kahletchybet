let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) { const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!AC) return null; ctx = new AC(); }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
function tone(f: number, d: number, type: OscillatorType, v: number, delay: number, slide?: number) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
}
export const sfx = {
  tick(i: number): void { tone(420 + i * 70, 0.05, "square", 0.05, 0); },
  pop(step: number): void { tone(300 * Math.pow(1.06, step), 0.12, "triangle", 0.12, 0, 120); },
  wild(): void { tone(880, 0.15, "sine", 0.12, 0, 1320); },
  chime(): void { tone(1200, 0.2, "sine", 0.12, 0); tone(1600, 0.25, "sine", 0.1, 0.08); },
  tension(): void { tone(180, 0.9, "sawtooth", 0.06, 0, 420); },
  fanfare(): void { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.3, "triangle", 0.12, i * 0.12); }); },
  free(): void { [440, 554, 659, 880].forEach(function (f, i) { tone(f, 0.35, "sine", 0.12, i * 0.1); }); }
};
