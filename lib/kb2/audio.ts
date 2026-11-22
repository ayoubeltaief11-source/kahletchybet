"use client";
import { readPrefs, writePrefs } from "@/lib/kb/prefs";
import { AMBIENT, themeFor, noteHz } from "./ambient";
import type { AmbientTheme } from "./ambient";

interface Levels { master: number; music: number; sfx: number; muted: boolean; }

class KbAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private humOsc: OscillatorNode[] = [];
  private humGain: GainNode | null = null;
  private humCut: BiquadFilterNode | null = null;
  private riseOsc: OscillatorNode | null = null;
  private riseGain: GainNode | null = null;
  private padOsc: OscillatorNode[] = [];
  private padGain: GainNode | null = null;
  private padCut: BiquadFilterNode | null = null;
  private padLfo: OscillatorNode | null = null;
  private arpTimer = 0;
  private arpStep = 0;
  private theme: AmbientTheme | null = null;
  private lv: Levels = { master: 0.8, music: 0.35, sfx: 0.9, muted: false };
  ready = false;

  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      try {
        this.ctx = new C();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.knee.value = 22; comp.ratio.value = 8;
        comp.attack.value = 0.004; comp.release.value = 0.22;
        this.master = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 1.2);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noise = buf;
        const p = readPrefs();
        this.setLevels(p.master, p.music, p.sfx, !p.sound);
        this.ready = true;
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setLevels(master: number, music: number, sfx: number, muted: boolean): void {
    this.lv = { master: master, music: music, sfx: sfx, muted: muted };
    if (!this.ctx || !this.master || !this.sfxBus || !this.musicBus) return;
    const t = this.ctx.currentTime;
    const m = muted ? 0 : master;
    this.master.gain.setTargetAtTime(m, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.05);
    this.musicBus.gain.setTargetAtTime(music, t, 0.08);
  }

  syncFromPrefs(): void {
    const p = readPrefs();
    this.setLevels(p.master, p.music, p.sfx, !p.sound);
  }

  saveLevels(patch: Partial<Levels>): void {
    const p = readPrefs();
    writePrefs(Object.assign({}, p, {
      master: patch.master !== undefined ? patch.master : p.master,
      music: patch.music !== undefined ? patch.music : p.music,
      sfx: patch.sfx !== undefined ? patch.sfx : p.sfx,
      sound: patch.muted !== undefined ? !patch.muted : p.sound
    }));
    this.syncFromPrefs();
  }

  get levels(): Levels { return this.lv; }

  private tone(freq: number, dur: number, wave: OscillatorType, gain: number, slide?: number, bus?: GainNode | null): void {
    if (!this.ctx || this.lv.muted) return;
    const target = bus || this.sfxBus;
    if (!target) return;
    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slide !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(target);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* silent */ }
  }

  private hiss(dur: number, gain: number, hp: number, lp?: number): void {
    if (!this.ctx || !this.noise || !this.sfxBus || this.lv.muted) return;
    try {
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = hp;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      if (lp !== undefined) {
        const l = this.ctx.createBiquadFilter();
        l.type = "lowpass"; l.frequency.value = lp;
        f.connect(l); l.connect(g);
      } else { f.connect(g); }
      g.connect(this.sfxBus);
      src.start(t); src.stop(t + dur + 0.02);
    } catch (e) { /* silent */ }
  }

  private seq(notes: number[], step: number, dur: number, wave: OscillatorType, gain: number): void {
    const self = this;
    notes.forEach(function (n, i) {
      window.setTimeout(function () { self.tone(n, dur, wave, gain); }, i * step);
    });
  }

  click(): void { this.tone(430, 0.045, "square", 0.05, 380); }
  chip(): void { this.tone(940, 0.055, "triangle", 0.07, 620); this.hiss(0.05, 0.03, 2800); }
  spin(): void { this.tone(170, 0.17, "sawtooth", 0.05, 340); this.hiss(0.12, 0.02, 900); }
  reel(): void { this.tone(132, 0.06, "square", 0.045, 84); this.hiss(0.035, 0.022, 1600); }
  tick(m: number): void { this.tone(280 + Math.min(950, m * 72), 0.04, "sine", 0.045); }
  count(n: number): void { this.tone(360 + n * 130, 0.11, "triangle", n <= 1 ? 0.1 : 0.07); }
  launch(): void { this.tone(110, 0.55, "sawtooth", 0.06, 580); this.hiss(0.42, 0.035, 380, 2200); }
  tumble(): void { this.tone(660, 0.09, "sine", 0.06, 300); this.hiss(0.06, 0.03, 1800, 6000); }
  scatter(): void { this.seq([1046, 1318, 1568], 60, 0.16, "sine", 0.08); this.hiss(0.2, 0.03, 3000); }
  coin(): void { this.tone(1568, 0.06, "square", 0.045, 1200); }
  safe(): void { this.tone(660, 0.09, "sine", 0.07, 880); }
  ball(): void { this.tone(1250, 0.035, "sine", 0.032, 940); }
  dice(): void { this.hiss(0.16, 0.05, 900, 5200); this.tone(300, 0.08, "square", 0.04, 200); }
  card(): void { this.hiss(0.09, 0.045, 2300); this.tone(520, 0.05, "triangle", 0.04, 700); }
  chain(n: number): void { this.tone(440 + Math.min(1200, n * 130), 0.12, "triangle", 0.09); }
  warn(): void { this.seq([300, 240], 110, 0.16, "square", 0.06); }
  lose(): void { this.tone(250, 0.3, "sine", 0.06, 120); }
  bust(): void { this.tone(210, 0.6, "sawtooth", 0.09, 45); this.hiss(0.45, 0.075, 160, 1400); }
  boom(): void { this.tone(90, 0.55, "square", 0.1, 32); this.hiss(0.5, 0.09, 110, 900); }
  win(): void { this.seq([523, 659, 784], 82, 0.2, "triangle", 0.09); }
  big(): void { this.seq([523, 659, 784, 1047, 1319], 76, 0.24, "triangle", 0.11); this.hiss(0.35, 0.03, 1800); }
  mega(): void {
    this.seq([523, 659, 784, 1047, 1319, 1568, 2093], 70, 0.28, "triangle", 0.12);
    this.hiss(0.6, 0.045, 1500);
    const self = this;
    for (let i = 0; i < 14; i++) {
      window.setTimeout(function () { self.coin(); }, 260 + i * 62);
    }
  }
  cash(): void {
    this.tone(1046, 0.07, "square", 0.09, 1568);
    const self = this;
    window.setTimeout(function () { self.tone(1568, 0.18, "sine", 0.11, 2093); }, 70);
    window.setTimeout(function () { self.hiss(0.14, 0.035, 3200); }, 40);
    for (let i = 0; i < 6; i++) {
      window.setTimeout(function () { self.coin(); }, 150 + i * 55);
    }
  }

  hum(on: boolean): void {
    if (!this.ctx || !this.sfxBus) return;
    if (!on) {
      const t = this.ctx.currentTime;
      if (this.humGain) this.humGain.gain.setTargetAtTime(0.0001, t, 0.12);
      const list = this.humOsc;
      const g = this.humGain;
      const f = this.humCut;
      this.humOsc = []; this.humGain = null; this.humCut = null;
      window.setTimeout(function () {
        list.forEach(function (o) { try { o.stop(); } catch (e) { /* stopped */ } });
        if (g) { try { g.disconnect(); } catch (e) { /* gone */ } }
        if (f) { try { f.disconnect(); } catch (e) { /* gone */ } }
      }, 420);
      return;
    }
    if (this.humOsc.length > 0) return;
    try {
      const t = this.ctx.currentTime;
      this.humCut = this.ctx.createBiquadFilter();
      this.humCut.type = "lowpass";
      this.humCut.frequency.value = 420;
      this.humCut.Q.value = 3;
      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.0001, t);
      this.humGain.gain.setTargetAtTime(0.05, t, 0.3);
      this.humCut.connect(this.humGain);
      this.humGain.connect(this.sfxBus);
      const base = 62;
      const self = this;
      [0, 7, 12].forEach(function (det, i) {
        if (!self.ctx || !self.humCut) return;
        const o = self.ctx.createOscillator();
        o.type = i === 2 ? "triangle" : "sawtooth";
        o.frequency.value = base * Math.pow(2, det / 12);
        o.detune.value = i * 6 - 6;
        o.connect(self.humCut);
        o.start(t);
        self.humOsc.push(o);
      });
    } catch (e) { /* silent */ }
  }

  humLevel(mult: number): void {
    if (!this.ctx || !this.humCut || !this.humGain || this.humOsc.length === 0) return;
    const t = this.ctx.currentTime;
    const k = Math.min(1, (mult - 1) / 8);
    this.humCut.frequency.setTargetAtTime(420 + k * 2100, t, 0.1);
    this.humGain.gain.setTargetAtTime(0.05 + k * 0.05, t, 0.15);
    const self = this;
    this.humOsc.forEach(function (o, i) {
      const base = 62 * Math.pow(2, [0, 7, 12][i] / 12);
      o.frequency.setTargetAtTime(base * (1 + k * 0.85), t, 0.12);
      void self;
    });
  }

  rise(mult: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    if (!this.riseOsc) {
      try {
        this.riseOsc = this.ctx.createOscillator();
        this.riseGain = this.ctx.createGain();
        this.riseOsc.type = "sine";
        this.riseGain.gain.setValueAtTime(0.0001, t);
        this.riseGain.gain.setTargetAtTime(0.035, t, 0.2);
        this.riseOsc.connect(this.riseGain);
        this.riseGain.connect(this.sfxBus);
        this.riseOsc.start(t);
      } catch (e) { return; }
    }
    if (this.riseOsc) {
      const f = 220 * Math.pow(2, Math.min(3.2, (mult - 1) / 3));
      this.riseOsc.frequency.setTargetAtTime(f, t, 0.08);
    }
  }

  riseStop(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.riseOsc;
    const g = this.riseGain;
    if (g) g.gain.setTargetAtTime(0.0001, t, 0.08);
    this.riseOsc = null; this.riseGain = null;
    window.setTimeout(function () {
      if (o) { try { o.stop(); } catch (e) { /* stopped */ } }
      if (g) { try { g.disconnect(); } catch (e) { /* gone */ } }
    }, 300);
  }

  ambient(key: string | null): void {
    if (!this.ctx || !this.musicBus) return;
    this.stopAmbient();
    if (!key) return;
    const th = key === "auto" ? AMBIENT.lobby : themeFor(key);
    this.theme = th;
    try {
      const t = this.ctx.currentTime;
      this.padCut = this.ctx.createBiquadFilter();
      this.padCut.type = "lowpass";
      this.padCut.frequency.value = th.cutoff;
      this.padCut.Q.value = 1.2;
      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime(0.0001, t);
      this.padGain.gain.setTargetAtTime(th.padLevel, t, 1.4);
      this.padCut.connect(this.padGain);
      this.padGain.connect(this.musicBus);
      const self = this;
      th.chord.forEach(function (semi, i) {
        if (!self.ctx || !self.padCut) return;
        const o = self.ctx.createOscillator();
        o.type = th.wave;
        o.frequency.value = noteHz(th.root, semi);
        o.detune.value = i * 4 - 6;
        o.connect(self.padCut);
        o.start(t);
        self.padOsc.push(o);
      });
      this.padLfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      this.padLfo.type = "sine";
      this.padLfo.frequency.value = 1000 / th.sweepMs;
      lg.gain.value = th.sweep;
      this.padLfo.connect(lg);
      lg.connect(this.padCut.frequency);
      this.padLfo.start(t);
      this.arpStep = 0;
      this.arpTimer = window.setInterval(function () {
        if (!self.theme || !self.musicBus) return;
        const cur = self.theme;
        const semi = cur.arp[self.arpStep % cur.arp.length];
        self.arpStep += 1;
        self.tone(noteHz(cur.root * 2, semi), 0.42, cur.arpWave, cur.arpLevel, undefined, self.musicBus);
      }, th.arpMs);
    } catch (e) { /* silent */ }
  }

  private stopAmbient(): void {
    if (this.arpTimer) { clearInterval(this.arpTimer); this.arpTimer = 0; }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.padGain) this.padGain.gain.setTargetAtTime(0.0001, t, 0.5);
    const oscs = this.padOsc;
    const lfo = this.padLfo;
    const g = this.padGain;
    const f = this.padCut;
    this.padOsc = []; this.padLfo = null; this.padGain = null; this.padCut = null; this.theme = null;
    window.setTimeout(function () {
      oscs.forEach(function (o) { try { o.stop(); } catch (e) { /* stopped */ } });
      if (lfo) { try { lfo.stop(); } catch (e) { /* stopped */ } }
      if (g) { try { g.disconnect(); } catch (e) { /* gone */ } }
      if (f) { try { f.disconnect(); } catch (e) { /* gone */ } }
    }, 1400);
  }

  stopAll(): void {
    this.hum(false);
    this.riseStop();
    this.stopAmbient();
  }
}

let single: KbAudioEngine | null = null;

let hooked = false;

export function getAudio(): KbAudioEngine {
  if (!single) single = new KbAudioEngine();
  if (!hooked && typeof window !== "undefined") {
    hooked = true;
    const open = function () {
      if (single) { single.unlock(); single.syncFromPrefs(); }
    };
    window.addEventListener("pointerdown", open, { passive: true });
    window.addEventListener("keydown", open);
  }
  return single;
}

export type { KbAudioEngine, Levels };
