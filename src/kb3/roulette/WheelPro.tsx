"use client";
import { useEffect, useRef, useState } from "react";
import { WHEEL, REDS } from "@/lib/kb2/rouletteMath";
import { computeTrajectory, pocketAngle, wheelRotation, type BallFrame } from "./wheelPhysics";

interface Props {
  number: number;
  spinning: boolean;
  hue: string;
  hue2: string;
  onLand?: () => void;
}

export default function WheelPro({ number, spinning, hue, hue2, onLand }: Props) {
  const [ballFrame, setBallFrame] = useState<BallFrame>({ a: 0, r: 1 });
  const [wheelDeg, setWheelDeg] = useState(0);
  const rafRef = useRef(0);
  const prevSpin = useRef(false);
  const total = WHEEL.length;

  useEffect(function () {
    if (spinning && !prevSpin.current) {
      prevSpin.current = true;
      const idx = WHEEL.indexOf(number);
      const target = pocketAngle(idx >= 0 ? idx : 0, total);
      const dur = 7 + Math.random() * 2;
      const fps = 60;
      const traj = computeTrajectory(target, dur, fps);
      const wRot = wheelRotation(dur, fps);
      let fi = 0;
      const start = performance.now();
      function tick(now: number) {
        const elapsed = (now - start) / 1000;
        const frame = Math.min(Math.floor(elapsed * fps), traj.length - 1);
        if (frame !== fi) {
          fi = frame;
          setBallFrame(traj[fi]);
          setWheelDeg(wRot[fi] * (180 / Math.PI));
        }
        if (fi < traj.length - 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setBallFrame(traj[traj.length - 1]);
          setWheelDeg(wRot[wRot.length - 1] * (180 / Math.PI));
          if (onLand) onLand();
          prevSpin.current = false;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    return function () { cancelAnimationFrame(rafRef.current); };
  }, [spinning, number, total, onLand]);

  const cx = 200, cy = 200, outerR = 170, innerR = 105, pocketR = 138;
  const seg = (Math.PI * 2) / total;

  const bx = cx + Math.cos(ballFrame.a) * (outerR * ballFrame.r * 0.82 + innerR * 0.18);
  const by = cy + Math.sin(ballFrame.a) * (outerR * ballFrame.r * 0.82 + innerR * 0.18);

  return (
    <svg viewBox="0 0 400 400" className="kp-wheel" style={{ width: "min(400px, 90vw)", height: "auto" }}>
      <defs>
        <linearGradient id="kp-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d5a0"/>
          <stop offset="35%" stopColor="#a08030"/>
          <stop offset="65%" stopColor="#d4b856"/>
          <stop offset="100%" stopColor="#6a4a10"/>
        </linearGradient>
        <radialGradient id="kp-cone" cx="0.45" cy="0.4">
          <stop offset="0%" stopColor={hue2}/>
          <stop offset="60%" stopColor={hue}/>
          <stop offset="100%" stopColor="#0a0e15"/>
        </radialGradient>
        <radialGradient id="kp-ball" cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#e0e0e0"/>
          <stop offset="100%" stopColor="#888888"/>
        </radialGradient>
        <filter id="kp-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5"/></filter>
      </defs>

      {/* Metallic rim */}
      <circle cx={cx} cy={cy} r={outerR + 12} fill="url(#kp-rim)" filter="url(#kp-shadow)"/>
      <circle cx={cx} cy={cy} r={outerR + 4} fill="#1a1408" stroke="#c9a83c" strokeWidth="1.5"/>

      {/* Rotating pocket ring */}
      <g style={{ transform: "rotate(" + wheelDeg + "deg)", transformOrigin: cx + "px " + cy + "px" }}>
        {WHEEL.map(function (n, i) {
          const a1 = i * seg - Math.PI / 2;
          const a2 = (i + 1) * seg - Math.PI / 2;
          const isRed = REDS.indexOf(n) >= 0;
          const fill = n === 0 ? "#0c7a4e" : isRed ? "#b82030" : "#10141c";
          const x1 = cx + Math.cos(a1) * outerR, y1 = cy + Math.sin(a1) * outerR;
          const x2 = cx + Math.cos(a2) * outerR, y2 = cy + Math.sin(a2) * outerR;
          const x3 = cx + Math.cos(a2) * innerR, y3 = cy + Math.sin(a2) * innerR;
          const x4 = cx + Math.cos(a1) * innerR, y4 = cy + Math.sin(a1) * innerR;
          const mid = (a1 + a2) / 2;
          const tx = cx + Math.cos(mid) * pocketR, ty = cy + Math.sin(mid) * pocketR;
          return (
            <g key={i}>
              <path d={"M"+x1+","+y1+" A"+outerR+","+outerR+" 0 0,1 "+x2+","+y2+" L"+x3+","+y3+" A"+innerR+","+innerR+" 0 0,0 "+x4+","+y4+" Z"} fill={fill} stroke="#2a2010" strokeWidth="0.6"/>
              <path d={"M"+x1+","+y1+" A"+outerR+","+outerR+" 0 0,1 "+x2+","+y2+" L"+x3+","+y3+" A"+innerR+","+innerR+" 0 0,0 "+x4+","+y4+" Z"} fill="rgba(0,0,0,0.18)" style={{clipPath:"inset(0 0 50% 0)"}}/>
              <text x={tx} y={ty + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Arial Black,Arial">{n}</text>
            </g>
          );
        })}
        {/* Deflector pins */}
        {Array.from({length: 8}).map(function(_, i) {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(a) * (outerR - 8), py = cy + Math.sin(a) * (outerR - 8);
          return <circle key={"d"+i} cx={px} cy={py} r="3.5" fill="#d4b856" stroke="#6a4a10" strokeWidth="1"/>;
        })}
      </g>

      {/* Center cone */}
      <circle cx={cx} cy={cy} r={innerR - 10} fill="url(#kp-cone)" stroke="#c9a83c" strokeWidth="2"/>
      <ellipse cx={cx - 12} cy={cy - 14} rx="18" ry="10" fill="rgba(255,255,255,0.25)"/>
      <circle cx={cx} cy={cy} r="18" fill={hue2} stroke="#1a1408" strokeWidth="2"/>

      {/* Ball */}
      <circle cx={bx} cy={by} r="7" fill="url(#kp-ball)" stroke="#555" strokeWidth="0.8" filter="url(#kp-shadow)"/>

      {/* Pointer */}
      <polygon points={cx+",12 "+(cx-8)+",28 "+(cx+8)+",28"} fill={hue2} stroke="#1a1408" strokeWidth="1"/>
    </svg>
  );
}
