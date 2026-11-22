export interface AmbientTheme {
  key: string;
  root: number;
  chord: number[];
  scale: number[];
  cutoff: number;
  sweep: number;
  sweepMs: number;
  arp: number[];
  arpMs: number;
  padLevel: number;
  arpLevel: number;
  wave: OscillatorType;
  arpWave: OscillatorType;
}

export const AMBIENT: Record<string, AmbientTheme> = {
  lobby: {
    key: "lobby", root: 110, chord: [0, 7, 12, 16], scale: [0, 2, 4, 7, 9, 12, 14, 16],
    cutoff: 700, sweep: 320, sweepMs: 15000, arp: [0, 4, 7, 12, 7, 4], arpMs: 1400,
    padLevel: 0.1, arpLevel: 0.035, wave: "triangle", arpWave: "sine"
  },
  crash: {
    key: "crash", root: 82.4, chord: [0, 3, 7, 10], scale: [0, 3, 5, 7, 10, 12, 15, 17],
    cutoff: 520, sweep: 420, sweepMs: 11000, arp: [0, 7, 10, 15, 10, 7], arpMs: 1150,
    padLevel: 0.12, arpLevel: 0.04, wave: "sawtooth", arpWave: "triangle"
  },
  slots: {
    key: "slots", root: 130.8, chord: [0, 4, 7, 11], scale: [0, 2, 4, 5, 7, 9, 11, 12],
    cutoff: 900, sweep: 500, sweepMs: 9000, arp: [0, 4, 7, 11, 12, 7], arpMs: 900,
    padLevel: 0.09, arpLevel: 0.045, wave: "triangle", arpWave: "sine"
  },
  roulette: {
    key: "roulette", root: 98, chord: [0, 5, 7, 12], scale: [0, 2, 5, 7, 9, 12, 14, 17],
    cutoff: 620, sweep: 260, sweepMs: 17000, arp: [0, 5, 9, 12, 9, 5], arpMs: 1650,
    padLevel: 0.11, arpLevel: 0.03, wave: "sine", arpWave: "triangle"
  },
  table: {
    key: "table", root: 116.5, chord: [0, 3, 7, 14], scale: [0, 3, 5, 7, 10, 12, 15, 19],
    cutoff: 560, sweep: 200, sweepMs: 19000, arp: [0, 3, 7, 14, 7, 3], arpMs: 1800,
    padLevel: 0.1, arpLevel: 0.028, wave: "sine", arpWave: "sine"
  },
  instant: {
    key: "instant", root: 146.8, chord: [0, 7, 12, 19], scale: [0, 2, 3, 7, 9, 12, 14, 15],
    cutoff: 820, sweep: 380, sweepMs: 12000, arp: [0, 7, 12, 15, 12, 7], arpMs: 1050,
    padLevel: 0.085, arpLevel: 0.042, wave: "triangle", arpWave: "square"
  }
};

export function themeFor(family: string): AmbientTheme {
  return AMBIENT[family] || AMBIENT.lobby;
}

export function noteHz(root: number, semitone: number): number {
  return root * Math.pow(2, semitone / 12);
}
