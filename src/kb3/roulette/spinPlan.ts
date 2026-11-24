export interface SpinPlan {
  pockets: number;
  targetIndex: number;
  duration: number;
  wheelStart: number;
  wheelOmega: number;
  ballStart: number;
  ballTravel: number;
  pocketAngle: number;
  dropStart: number;
  bounceStart: number;
  hops: number;
}

const TAU = Math.PI * 2;

export function makePlan(pockets: number, targetIndex: number, rng: () => number, wheelStart: number): SpinPlan {
  const duration = 8 + rng() * 2;
  const wheelOmega = -(0.85 + rng() * 0.3);
  const pocketAngle = (targetIndex / pockets) * TAU;
  const wheelEnd = wheelStart + wheelOmega * duration;
  const ballStart = rng() * TAU;
  let rem = (pocketAngle - wheelEnd - ballStart) % TAU;
  if (rem > 0) rem -= TAU;
  const turns = 6 + Math.floor(rng() * 3);
  return {
    pockets: pockets, targetIndex: targetIndex, duration: duration,
    wheelStart: wheelStart, wheelOmega: wheelOmega, ballStart: ballStart,
    ballTravel: rem - TAU * turns, pocketAngle: pocketAngle,
    dropStart: 0.55, bounceStart: 0.8, hops: 2 + Math.floor(rng() * 2)
  };
}

export function wheelRotAt(p: SpinPlan, t: number, idleAfter: boolean): number {
  const end = p.wheelStart + p.wheelOmega * p.duration;
  if (t <= p.duration) return p.wheelStart + p.wheelOmega * t;
  const dt = t - p.duration;
  if (idleAfter) return end + p.wheelOmega * dt;
  const tau = 0.9;
  return end + p.wheelOmega * tau * (1 - Math.exp(-dt / tau));
}

export function ballAt(p: SpinPlan, t: number): { angle: number; r01: number; hop: number; speed01: number } {
  const u = Math.min(1, Math.max(0, t / p.duration));
  const ease = 1 - Math.pow(1 - u, 3);
  let angle = p.ballStart + p.ballTravel * ease;
  const speed01 = Math.pow(1 - u, 2);
  let r01 = 1;
  let hop = 0;
  if (u > p.dropStart && u <= p.bounceStart) {
    const d = (u - p.dropStart) / (p.bounceStart - p.dropStart);
    r01 = 1 - d * d * (3 - 2 * d);
  } else if (u > p.bounceStart) {
    r01 = 0;
    const b = (u - p.bounceStart) / (1 - p.bounceStart);
    hop = Math.abs(Math.sin(b * Math.PI * p.hops)) * (1 - b) * 0.14;
    angle += 0.05 * Math.sin(b * 34) * Math.pow(1 - b, 2);
  }
  if (u >= 1) { angle = p.ballStart + p.ballTravel; hop = 0; r01 = 0; }
  return { angle: angle, r01: r01, hop: hop, speed01: speed01 };
}
