export interface BallFrame { a: number; r: number }

export function computeTrajectory(targetAngle: number, totalSec: number, fps: number): BallFrame[] {
  const N = Math.ceil(totalSec * fps);
  const out: BallFrame[] = [];
  const turns = 6 + Math.floor(Math.random() * 2);
  const totalRot = targetAngle + Math.PI * 2 * turns;

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ease = 1 - Math.pow(1 - t, 3.2);
    const a = totalRot * ease;

    let r: number;
    if (t < 0.52) {
      r = 1.0;
    } else if (t < 0.68) {
      const d = (t - 0.52) / 0.16;
      r = 1.0 - 0.38 * (d * d * (3 - 2 * d));
    } else if (t < 0.84) {
      const b = (t - 0.68) / 0.16;
      r = 0.62 + 0.055 * Math.sin(b * Math.PI * 2.8) * (1 - b * 0.9);
    } else {
      const s = (t - 0.84) / 0.16;
      r = 0.62 - 0.02 * Math.sin(s * Math.PI) * (1 - s);
    }

    out.push({ a: a, r: r });
  }
  return out;
}

export function pocketAngle(index: number, total: number): number {
  return (index / total) * Math.PI * 2 - Math.PI / 2;
}

export function wheelRotation(totalSec: number, fps: number): number[] {
  const N = Math.ceil(totalSec * fps);
  const out: number[] = [];
  const omega = -0.7;
  for (let i = 0; i <= N; i++) {
    out.push(omega * (i / fps));
  }
  return out;
}
