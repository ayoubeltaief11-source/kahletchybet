"use client";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf } from "@/lib/kb/sig";

function Words({ name, uid }: { name: string; uid: string }) {
  const w = name.toUpperCase().split(" ");
  const cut = w.length > 1 ? Math.ceil(w.length / 2) : 1;
  const a = w.slice(0, cut).join(" ");
  const b = w.slice(cut).join(" ");
  const longest = Math.max(a.length, b.length);
  const size = longest > 13 ? 20 : longest > 10 ? 24 : longest > 7 ? 29 : 34;
  return (
    <g>
      <text x="160" y={b ? 128 : 140} textAnchor="middle" fontSize={size} fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="0.5" fill={"url(#t" + uid + ")"} stroke="#2a1a02" strokeWidth="2.6" paintOrder="stroke" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,.85))" }}>{a}</text>
      {b && <text x="160" y={128 + size * 0.92} textAnchor="middle" fontSize={size * 0.86} fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="0.5" fill={"url(#t" + uid + ")"} stroke="#2a1a02" strokeWidth="2.4" paintOrder="stroke" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,.85))" }}>{b}</text>}
    </g>
  );
}

function Env({ e, family, uid, hue }: { e: number; family: string; uid: string; hue: string }) {
  if (family === "slots" && e === 3) return (<g opacity="0.55"><path d="M0 150 Q40 120 80 150 T160 150 T240 150 T320 150 V180 H0Z" fill={hue} opacity="0.35"/><path d="M0 162 Q40 138 80 162 T160 162 T240 162 T320 162 V180 H0Z" fill="#000" opacity="0.4"/>{[30,90,150,210,270].map(function(x,i){return <circle key={i} cx={x} cy={40+(i%3)*18} r={2.4} fill="#fff" opacity="0.5"/>;})}</g>);
  if (e === 0) return (<g>{Array.from({length:34}).map(function(_,i){const x=(i*97)%320,y=(i*53)%130,r=i%5===0?1.7:0.9;return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={i%3===0?0.85:0.45}/>;})}<ellipse cx="240" cy="42" rx="86" ry="52" fill={"url(#neb" + uid + ")"}/></g>);
  if (e === 1) return (<g opacity="0.7"><ellipse cx="70" cy="52" rx="52" ry="19" fill="#fff" opacity="0.18"/><ellipse cx="112" cy="44" rx="38" ry="15" fill="#fff" opacity="0.14"/><ellipse cx="252" cy="70" rx="60" ry="20" fill="#fff" opacity="0.13"/><circle cx="272" cy="34" r="26" fill={hue} opacity="0.3"/><circle cx="272" cy="34" r="13" fill="#fff" opacity="0.35"/></g>);
  if (e === 2) return (<g opacity="0.72">{[0,26,50,78,104,132,158,186,214,242,270,296].map(function(x,i){const h=26+((i*37)%54);return <g key={i}><rect x={x} y={180-h-26} width={22} height={h+26} fill="#04070c" opacity="0.82"/>{Array.from({length:Math.floor(h/11)}).map(function(_,j){return <rect key={j} x={x+4+(j%2)*9} y={180-h-20+j*11} width={4} height={5} fill={hue} opacity={(i+j)%3===0?0.85:0.25}/>;})}</g>;})}</g>);
  return (<g opacity="0.7"><path d="M0 156 L52 108 L92 140 L146 92 L196 138 L246 100 L300 142 L320 126 V180 H0Z" fill="#04070c" opacity="0.85"/><path d="M0 168 L60 132 L110 158 L164 122 L214 156 L268 128 L320 158 V180 H0Z" fill="#000" opacity="0.6"/><path d="M20 30 Q100 6 180 28 T310 20" stroke={hue} strokeWidth="12" fill="none" opacity="0.2"/><path d="M30 44 Q110 22 190 42 T312 34" stroke="#7ef9d0" strokeWidth="7" fill="none" opacity="0.16"/></g>);
}

function Hero({ g, uid }: { g: KBGame; uid: string }) {
  const v = g.variant, hue = g.hue;
  const gold = "url(#g" + uid + ")";
  if (v === "jet") return (<g transform="translate(160 74) rotate(-14) scale(1.55)"><path d="M-70 6h44l8-6-8-6h-44Z" fill={"url(#fl" + uid + ")"}/><path d="M-38 0 26-10 60-24 70-19 48-3 70 13 60 18 26 6-38 0Z" fill={gold} stroke="#3a2705" strokeWidth="1.4"/><path d="M4-6-14-32l10 2 22 22Z" fill={hue} stroke="#3a2705" strokeWidth="1.1"/><path d="M4 6-14 32l10-2 22-22Z" fill={hue} stroke="#3a2705" strokeWidth="1.1"/><ellipse cx="42" cy="-8" rx="10" ry="5.5" fill="#a9e6ff" stroke="#0d3550" strokeWidth="1.2"/><path d="M-30-3 20-8" stroke="#fff" strokeWidth="1.6" opacity="0.5"/></g>);
  if (v === "rocket") return (<g transform="translate(160 72) scale(1.5)"><path d="M-11 40h22l-11 34Z" fill={"url(#fl" + uid + ")"}/><path d="M0-46c14 14 20 34 20 56v34H-20V10c0-22 6-42 20-56Z" fill={gold} stroke="#3a2705" strokeWidth="1.5"/><path d="M-20 22-36 52l16-6Z" fill={hue} stroke="#3a2705" strokeWidth="1.1"/><path d="M20 22l16 30-16-6Z" fill={hue} stroke="#3a2705" strokeWidth="1.1"/><circle cx="0" cy="-8" r="10" fill="#a9e6ff" stroke="#0d3550" strokeWidth="1.6"/><circle cx="-3" cy="-11" r="3.4" fill="#fff" opacity="0.7"/><path d="M-16 34h32" stroke="#3a2705" strokeWidth="1.6"/></g>);
  if (v === "zeppelin") return (<g transform="translate(160 70) scale(1.5)"><ellipse cx="0" cy="0" rx="66" ry="27" fill={gold} stroke="#3a2705" strokeWidth="1.5"/><path d="M-66 0h132" stroke="#3a2705" strokeWidth="1" opacity="0.45"/><path d="M62-14l16-10v48l-16-10Z" fill={hue} stroke="#3a2705" strokeWidth="1.1"/><rect x="-18" y="26" width="36" height="15" rx="4" fill="#2b1e04" stroke="#3a2705"/><path d="M-10 26v-5M10 26v-5" stroke="#3a2705" strokeWidth="1.5"/><ellipse cx="-24" cy="-11" rx="22" ry="7" fill="#fff" opacity="0.35"/></g>);
  if (v === "heli") return (<g transform="translate(160 70) scale(1.5)"><rect x="-70" y="-30" width="140" height="6" rx="3" fill="#2b1e04"/><rect x="-3" y="-26" width="6" height="14" fill="#2b1e04"/><path d="M-40 0c0-10 12-14 30-14h26c15 0 25 7 28 16l16 6-16 6c-3 9-13 12-28 12h-30c-15 0-26-6-26-16Z" fill={gold} stroke="#3a2705" strokeWidth="1.4"/><ellipse cx="28" cy="2" rx="13" ry="8" fill="#a9e6ff" stroke="#0d3550" strokeWidth="1.3"/><path d="M-34 16h50" stroke="#3a2705" strokeWidth="1.6"/><path d="M-26 26h40" stroke="#2b1e04" strokeWidth="3"/></g>);
  if (v === "mega5") return (<g transform="translate(160 76) scale(1.35)"><circle cx="0" cy="0" r="52" fill={hue} opacity="0.28"/><path d="M0-46c22 0 38 17 38 40S22 42 0 42-38 24-38-6-22-46 0-46Z" fill={gold} stroke="#3a2705" strokeWidth="1.6"/><ellipse cx="0" cy="4" rx="24" ry="27" fill="#ffe9b0" opacity="0.92"/><circle cx="-11" cy="-4" r="5.6" fill="#0d3b1e"/><circle cx="11" cy="-4" r="5.6" fill="#0d3b1e"/><circle cx="-9.5" cy="-5.5" r="2" fill="#fff"/><circle cx="12.5" cy="-5.5" r="2" fill="#fff"/><path d="M0 8l-6 8h12Z" fill="#7a4a06"/><path d="M-13 22c6 6 20 6 26 0" stroke="#7a4a06" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M-30-28c6-9 16-14 30-14" stroke="#fff" strokeWidth="3" opacity="0.4" fill="none"/></g>);
  if (v === "wood" || v === "neon" || v === "vip") return (<g transform="translate(160 78)"><circle cx="0" cy="0" r="56" fill={gold}/><circle cx="0" cy="0" r="50" fill="#0a0e15"/>{Array.from({length:18}).map(function(_,i){const a0=i*20-90,a1=a0+20;const pt=function(a: number,r: number): [number,number]{return [r*Math.cos(a*Math.PI/180),r*Math.sin(a*Math.PI/180)];};const A=pt(a0,48),B=pt(a1,48),C=pt(a1,29),D=pt(a0,29);const f=i%2===0?"#c4202f":"#141a24";return <path key={i} d={"M"+A[0]+" "+A[1]+" A48 48 0 0 1 "+B[0]+" "+B[1]+" L"+C[0]+" "+C[1]+" A29 29 0 0 0 "+D[0]+" "+D[1]+" Z"} fill={i===0?"#0c7a4e":f} stroke={hue} strokeWidth="0.6"/>;})}<circle cx="0" cy="0" r="29" fill="#0a0e15" stroke={hue} strokeWidth="1.4"/><circle cx="0" cy="0" r="11" fill={gold}/><circle cx="26" cy="-38" r="5" fill="#fff"/></g>);
  if (v === "mines") return (<g transform="translate(160 76)"><circle cx="-30" cy="6" r="34" fill="#0a0e15" stroke="#3a4453" strokeWidth="2"/><circle cx="-40" cy="-6" r="10" fill="#fff" opacity="0.16"/><path d="M-14-24l10-10 6 6-10 10Z" fill="#5a6472"/><path d="M2-34c8-6 16-4 20 2" stroke="#f0b429" strokeWidth="3.4" fill="none"/><circle cx="24" cy="-32" r="6" fill="#ff6b3d"/><g transform="translate(34 14) scale(0.9)"><path d="M0-30 26-10 0 34-26-10Z" fill={"url(#gem" + uid + ")"} stroke="#0a5a72" strokeWidth="1.6"/><path d="M0-30 26-10H-26Z" fill="#fff" opacity="0.35"/></g></g>);
  if (v === "plinko") return (<g transform="translate(160 72)">{Array.from({length:5}).map(function(_,r){return <g key={r}>{Array.from({length:r+3}).map(function(_,i){return <circle key={i} cx={(i-(r+2)/2)*20} cy={r*17-34} r="3.6" fill="#fff" opacity="0.75"/>;})}</g>;})}<circle cx="10" cy="-52" r="9" fill={gold}/><rect x="-72" y="52" width="144" height="12" rx="4" fill={hue} opacity="0.5"/></g>);
  if (v === "dice" || v === "sicbo") return (<g transform="translate(160 76)"><g transform="rotate(-12) translate(-30 0)"><rect x="-30" y="-30" width="60" height="60" rx="12" fill="#fdfdfb" stroke="#98a2b0" strokeWidth="2"/>{[[-14,-14],[14,-14],[0,0],[-14,14],[14,14]].map(function(p,i){return <circle key={i} cx={p[0]} cy={p[1]} r="6" fill="#141821"/>;})}</g><g transform="rotate(14) translate(34 6)"><rect x="-26" y="-26" width="52" height="52" rx="10" fill={gold} stroke="#3a2705" strokeWidth="2"/>{[[-12,-12],[12,12]].map(function(p,i){return <circle key={i} cx={p[0]} cy={p[1]} r="5.4" fill="#3a2705"/>;})}</g></g>);
  if (v === "blackjack" || v === "baccarat" || v === "hilo") return (<g transform="translate(160 74)">{[[-40,-16,"A","#c4202f"],[0,0,"K","#141821"],[40,-16,"Q","#c4202f"]].map(function(c,i){return <g key={i} transform={"translate("+c[0]+" "+c[1]+") rotate("+(i*10-10)+")"}><rect x="-27" y="-38" width="54" height="76" rx="7" fill="#fdfdfb" stroke="#98a2b0" strokeWidth="1.6"/><text x="0" y="10" textAnchor="middle" fontSize="34" fontWeight="900" fontFamily="Arial" fill={String(c[3])}>{String(c[2])}</text></g>;})}</g>);
  const syms = g.syms.slice(0,3);
  return (<g transform="translate(160 74)">{syms.map(function(_,i){return <g key={i} transform={"translate("+(i*58-58)+" 0) scale(1.15)"}><circle cx="0" cy="0" r="27" fill="#0a0e15" opacity="0.55"/><path d="M0-24 22-8 0 28-22-8Z" fill={i===0?"url(#gem"+uid+")":i===1?gold:"url(#gem2"+uid+")"} stroke="#2a3040" strokeWidth="1.4"/><path d="M0-24 22-8H-22Z" fill="#fff" opacity="0.32"/></g>;})}</g>);
}

export default function Poster({ g }: { g: KBGame }) {
  const s = sigOf(g.id);
  const uid = g.id;
  const frame = s.frame;
  const fc = frame === 1 ? g.hue : frame === 2 ? "#7b5e3b" : frame === 3 ? "#9fd8ef" : "#e8b33c";
  return (
    <svg viewBox="0 0 320 180" className="kb-poster" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={"bg"+uid} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stopColor={g.sky[0]}/><stop offset="100%" stopColor={g.sky[1]}/></linearGradient>
        <radialGradient id={"sp"+uid} cx="0.5" cy="0.28"><stop offset="0%" stopColor={g.hue} stopOpacity="0.55"/><stop offset="100%" stopColor={g.hue} stopOpacity="0"/></radialGradient>
        <radialGradient id={"neb"+uid} cx="0.5" cy="0.5"><stop offset="0%" stopColor={g.hue} stopOpacity="0.4"/><stop offset="100%" stopColor={g.hue} stopOpacity="0"/></radialGradient>
        <linearGradient id={"g"+uid} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#fff6d8"/><stop offset="45%" stopColor="#e8b33c"/><stop offset="100%" stopColor="#7a5104"/></linearGradient>
        <linearGradient id={"t"+uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fffbe8"/><stop offset="42%" stopColor="#ffd97a"/><stop offset="62%" stopColor="#e8a01c"/><stop offset="100%" stopColor="#fff0b8"/></linearGradient>
        <linearGradient id={"fl"+uid} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff3c4" stopOpacity="0"/><stop offset="45%" stopColor="#ff9f43"/><stop offset="100%" stopColor="#ff4757"/></linearGradient>
        <linearGradient id={"gem"+uid} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stopColor="#dffaff"/><stop offset="55%" stopColor="#3fbfe0"/><stop offset="100%" stopColor="#0a5a72"/></linearGradient>
        <linearGradient id={"gem2"+uid} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stopColor="#ffc2e8"/><stop offset="55%" stopColor="#e0308a"/><stop offset="100%" stopColor="#6b0a38"/></linearGradient>
        <linearGradient id={"vig"+uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000" stopOpacity="0.35"/><stop offset="42%" stopColor="#000" stopOpacity="0"/><stop offset="100%" stopColor="#000" stopOpacity="0.8"/></linearGradient>
      </defs>
      <rect width="320" height="180" fill={"url(#bg"+uid+")"}/>
      <Env e={s.env} family={g.family} uid={uid} hue={g.hue}/>
      <rect width="320" height="180" fill={"url(#sp"+uid+")"}/>
      <Hero g={g} uid={uid}/>
      <rect width="320" height="180" fill={"url(#vig"+uid+")"}/>
      {g.jp.length > 0 && g.jp[0] !== "" && (
        <g>{g.jp.slice(0,5).map(function(j,i){
          const parts = j.split(" ");
          const cols = ["#ff4757","#e8b33c","#a855f7","#12d18e","#3b82f6"];
          const w = 320 / Math.min(5, g.jp.length);
          return <g key={i} transform={"translate("+(i*w)+" 0)"}><rect x="1" y="1" width={w-2} height="17" fill={cols[i%5]} opacity="0.92"/><text x={w/2} y="8" textAnchor="middle" fontSize="5.4" fontWeight="900" fontFamily="Arial" fill="#fff" opacity="0.9">{parts[0]}</text><text x={w/2} y="15" textAnchor="middle" fontSize="6.6" fontWeight="900" fontFamily="Arial" fill="#fff">{parts.slice(1).join(" ")}</text></g>;
        })}</g>
      )}
      <Words name={g.name} uid={uid}/>
      <rect x="0" y="164" width="320" height="16" fill="#04070c" opacity="0.82"/>
      <text x="8" y="175" fontSize="7" fontWeight="900" fontFamily="Arial" letterSpacing="1.6" fill={fc}>KB STUDIO</text>
      <text x="312" y="175" textAnchor="end" fontSize="6.4" fontWeight="800" fontFamily="Arial" letterSpacing="1" fill="#8fa2ba">{g.family.toUpperCase()}</text>
      {frame === 0 && <g><rect x="2" y="2" width="316" height="176" fill="none" stroke={fc} strokeWidth="2.4"/><rect x="6" y="6" width="308" height="168" fill="none" stroke={fc} strokeWidth="0.8" opacity="0.55"/>{[[2,2,1,1],[318,2,-1,1],[2,178,1,-1],[318,178,-1,-1]].map(function(c,i){return <path key={i} d={"M"+c[0]+" "+(c[1]+18*c[3])+" L"+c[0]+" "+c[1]+" L"+(c[0]+18*c[2])+" "+c[1]} fill="none" stroke="#fff6d8" strokeWidth="3"/>;})}</g>}
      {frame === 1 && <g><rect x="3" y="3" width="314" height="174" fill="none" stroke={fc} strokeWidth="2.6" opacity="0.95"/><rect x="3" y="3" width="314" height="174" fill="none" stroke={fc} strokeWidth="7" opacity="0.22"/><path d="M3 40V3h40M277 3h40v37M317 140v37h-40M43 177H3v-37" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.7"/></g>}
      {frame === 2 && <g><rect x="2" y="2" width="316" height="176" fill="none" stroke="#3a2705" strokeWidth="5"/><rect x="4" y="4" width="312" height="172" fill="none" stroke={fc} strokeWidth="2"/>{Array.from({length:16}).map(function(_,i){return <circle key={i} cx={12+i*20} cy={9} r="1.6" fill="#fff6d8" opacity="0.5"/>;})}{Array.from({length:16}).map(function(_,i){return <circle key={i} cx={12+i*20} cy={171} r="1.6" fill="#fff6d8" opacity="0.5"/>;})}</g>}
      {frame === 3 && <g><rect x="3" y="3" width="314" height="174" fill="none" stroke={fc} strokeWidth="2" opacity="0.8"/><path d="M3 3h314l-14 12H17Z" fill="#fff" opacity="0.18"/><path d="M3 177h314l-14-12H17Z" fill="#fff" opacity="0.1"/><rect x="8" y="8" width="304" height="164" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.3"/></g>}
    </svg>
  );
}
