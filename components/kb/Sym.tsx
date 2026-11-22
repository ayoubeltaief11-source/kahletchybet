"use client";
const P: Record<string,[string,string,string]> = {
  ruby:["#ff9db0","#e01e46","#7a0021"], sapphire:["#9dd2ff","#1668d6","#062f66"],
  emerald:["#9dffc9","#0fa85f","#04522c"], amethyst:["#dcb6ff","#8b3fd6","#3d1069"],
  diamond:["#dffaff","#6fd8ef","#1a7f96"], coin:["#ffe9a8","#e8b33c","#8a5a06"],
  crown:["#fff0b8","#f0b429","#8a5a06"], pot:["#ffdf9e","#c98a2e","#6b3f05"],
  lion:["#ffdf9e","#d98324","#6b3305"], bell:["#ffeaa8","#e0a020","#7a5104"],
  seven:["#ffb3b3","#e02020","#6e0000"], bar:["#e8e8f0","#7c86a8","#2a3050"],
  cherry:["#ff9d9d","#d61f3c","#6b0016"], lemon:["#fff59d","#e8c62a","#7a6205"],
  grape:["#d9b3ff","#7b3fd6","#33106b"], melon:["#b3ffcf","#22a85f","#0b5230"],
  candy:["#ffc2e8","#f0489c","#7a0a44"], heart:["#ffb3d1","#e8306e","#7a0a30"],
  star:["#fff3a8","#f0c020","#8a6205"], clover:["#b3ffcf","#1fa855","#0a5228"],
  shield:["#dbe4f0","#8290ad","#2a3050"], lotus:["#ffd9f0","#e85fa8","#7a1a4a"]
};
export default function Sym({ k, size = 56 }: { k: string; size?: number }) {
  const c = P[k] || P.coin; const id = "sg_" + k;
  const defs = (<defs>
    <linearGradient id={id} x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor={c[0]}/><stop offset="55%" stopColor={c[1]}/><stop offset="100%" stopColor={c[2]}/></linearGradient>
    <linearGradient id={id+"g"} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.85"/><stop offset="55%" stopColor="#fff" stopOpacity="0.08"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
    <radialGradient id={id+"r"} cx="0.35" cy="0.28"><stop offset="0%" stopColor="#fff" stopOpacity="0.9"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
  </defs>);
  const F = "url(#" + id + ")", G = "url(#" + id + "g)", R = "url(#" + id + "r)", S = c[2];
  const box = { width:size, height:size, viewBox:"0 0 64 64" };
  if(k==="ruby"||k==="sapphire"||k==="emerald"||k==="amethyst"||k==="diamond"){
    return (<svg {...box}>{defs}<path d="M32 3 56 21 32 61 8 21Z" fill={F} stroke={S} strokeWidth="1.6"/><path d="M32 3 56 21H8Z" fill={G}/><path d="M8 21h48L32 61Z" fill="#000" opacity="0.14"/><path d="M32 3 21 21l11 40 11-40Z" fill="#fff" opacity="0.2"/><circle cx="24" cy="16" r="5" fill={R}/></svg>);
  }
  if(k==="coin"||k==="pot"){
    if(k==="pot") return (<svg {...box}>{defs}<path d="M14 30h36v14a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12Z" fill={F} stroke={S} strokeWidth="1.6"/><ellipse cx="32" cy="29" rx="20" ry="6" fill={c[0]} stroke={S} strokeWidth="1.4"/><circle cx="24" cy="24" r="5" fill={F}/><circle cx="34" cy="21" r="6" fill={F}/><circle cx="43" cy="25" r="4.5" fill={F}/><path d="M18 36c4 3 10 4 14 4" stroke="#fff" strokeWidth="2.5" opacity="0.4" fill="none"/></svg>);
    return (<svg {...box}>{defs}<circle cx="32" cy="32" r="26" fill={F} stroke={S} strokeWidth="2"/><circle cx="32" cy="32" r="19" fill="none" stroke={S} strokeWidth="1.5" opacity="0.65"/><text x="32" y="41" textAnchor="middle" fontSize="21" fontWeight="900" fill={S} fontFamily="Arial">T</text><path d="M17 20a22 22 0 0 1 15-7" stroke="#fff" strokeWidth="3.4" opacity="0.6" fill="none" strokeLinecap="round"/></svg>);
  }
  if(k==="crown") return (<svg {...box}>{defs}<path d="M7 46h50l4-30-15 11L32 8 18 27 3 16Z" fill={F} stroke={S} strokeWidth="1.7" strokeLinejoin="round"/><rect x="7" y="46" width="50" height="10" rx="3.5" fill={c[2]}/><circle cx="32" cy="34" r="4.4" fill="#fff" opacity="0.9"/><circle cx="15" cy="38" r="2.8" fill="#fff" opacity="0.65"/><circle cx="49" cy="38" r="2.8" fill="#fff" opacity="0.65"/><path d="M12 22l6 5" stroke="#fff" strokeWidth="2" opacity="0.5"/></svg>);
  if(k==="lion") return (<svg {...box}>{defs}<circle cx="32" cy="32" r="27" fill={c[2]} opacity="0.55"/><path d="M32 6c14 0 24 11 24 26S46 58 32 58 8 47 8 32 18 6 32 6Z" fill={F} stroke={S} strokeWidth="1.5"/><ellipse cx="32" cy="34" rx="15" ry="17" fill={c[0]} opacity="0.9"/><circle cx="25" cy="29" r="3.6" fill="#0d3b1e"/><circle cx="39" cy="29" r="3.6" fill="#0d3b1e"/><circle cx="26" cy="28" r="1.3" fill="#fff"/><circle cx="40" cy="28" r="1.3" fill="#fff"/><path d="M32 36l-4 5h8Z" fill={S}/><path d="M24 45c4 4 12 4 16 0" stroke={S} strokeWidth="2.4" fill="none" strokeLinecap="round"/><path d="M14 18c4-6 10-9 18-9" stroke="#fff" strokeWidth="2.6" opacity="0.45" fill="none"/></svg>);
  if(k==="bell") return (<svg {...box}>{defs}<path d="M32 7c-12 0-19 10-19 24 0 8-3 12-6 16h50c-3-4-6-8-6-16 0-14-7-24-19-24Z" fill={F} stroke={S} strokeWidth="1.7"/><circle cx="32" cy="53" r="6.5" fill={c[2]}/><path d="M25 16c-5 5-8 11-8 19" stroke="#fff" strokeWidth="3.4" opacity="0.55" fill="none" strokeLinecap="round"/><rect x="28" y="3" width="8" height="6" rx="3" fill={c[2]}/></svg>);
  if(k==="seven") return (<svg {...box}>{defs}<rect x="5" y="5" width="54" height="54" rx="13" fill={F} stroke={S} strokeWidth="1.8"/><text x="32" y="47" textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff" fontFamily="Arial" stroke={S} strokeWidth="1.4">7</text><path d="M11 14c4-4 9-6 14-6" stroke="#fff" strokeWidth="3" opacity="0.45" fill="none" strokeLinecap="round"/></svg>);
  if(k==="bar") return (<svg {...box}>{defs}<rect x="6" y="16" width="52" height="32" rx="7" fill={F} stroke={S} strokeWidth="1.8"/><text x="32" y="39" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff" fontFamily="Arial" letterSpacing="1">BAR</text><rect x="10" y="20" width="44" height="8" rx="4" fill="#fff" opacity="0.22"/></svg>);
  if(k==="cherry") return (<svg {...box}>{defs}<path d="M32 9c7 8 15 13 19 24" stroke="#1f7a3d" strokeWidth="3.6" fill="none" strokeLinecap="round"/><path d="M32 9c-7 8-15 13-19 24" stroke="#1f7a3d" strokeWidth="3.6" fill="none" strokeLinecap="round"/><path d="M32 9c6-5 12-5 16-2-4 5-10 6-16 2Z" fill="#2fa85f"/><circle cx="15" cy="45" r="13" fill={F} stroke={S} strokeWidth="1.5"/><circle cx="49" cy="45" r="13" fill={F} stroke={S} strokeWidth="1.5"/><circle cx="11" cy="40" r="3.8" fill="#fff" opacity="0.75"/><circle cx="45" cy="40" r="3.8" fill="#fff" opacity="0.75"/></svg>);
  if(k==="lemon") return (<svg {...box}>{defs}<ellipse cx="32" cy="34" rx="24" ry="18" fill={F} stroke={S} strokeWidth="1.6"/><path d="M56 34c4-2 6-5 6-7" stroke={S} strokeWidth="3.4" fill="none" strokeLinecap="round"/><ellipse cx="23" cy="27" rx="8" ry="4.5" fill="#fff" opacity="0.6"/><path d="M12 34h40" stroke={S} strokeWidth="1" opacity="0.35"/></svg>);
  if(k==="grape") return (<svg {...box}>{defs}<path d="M32 6v9" stroke="#1f7a3d" strokeWidth="3.2" strokeLinecap="round"/><path d="M32 8c5-4 10-3 13 0-3 4-9 5-13 0Z" fill="#2fa85f"/>{[[32,22],[22,31],[42,31],[32,35],[23,45],[41,45],[32,52]].map(function(p,i){return <circle key={i} cx={p[0]} cy={p[1]} r="8.4" fill={F} stroke={S} strokeWidth="1.1"/>;})}<circle cx="29" cy="19" r="2.6" fill="#fff" opacity="0.65"/></svg>);
  if(k==="melon") return (<svg {...box}>{defs}<path d="M4 44a28 28 0 0 1 56 0Z" fill={F} stroke={S} strokeWidth="1.6"/><path d="M4 44h56v7H4Z" fill="#1f7a3d"/><path d="M8 44a24 24 0 0 1 48 0Z" fill="#ff6b7d" opacity="0.85"/>{[[20,36],[32,31],[44,36],[26,42],[38,42]].map(function(p,i){return <ellipse key={i} cx={p[0]} cy={p[1]} rx="2.1" ry="3.2" fill="#20120a"/>;})}</svg>);
  if(k==="candy") return (<svg {...box}>{defs}<circle cx="32" cy="32" r="17" fill={F} stroke={S} strokeWidth="1.6"/><path d="M32 15a17 17 0 0 1 0 34" fill="#fff" opacity="0.22"/><path d="M15 24 4 17l3 13-3 13 11-7Z" fill={c[1]} stroke={S} strokeWidth="1.2"/><path d="M49 24l11-7-3 13 3 13-11-7Z" fill={c[1]} stroke={S} strokeWidth="1.2"/><circle cx="26" cy="26" r="4.6" fill="#fff" opacity="0.7"/></svg>);
  if(k==="heart") return (<svg {...box}>{defs}<path d="M32 57S7 41 7 24a13.5 13.5 0 0 1 25-7.5A13.5 13.5 0 0 1 57 24c0 17-25 33-25 33Z" fill={F} stroke={S} strokeWidth="1.6"/><path d="M17 20a9 9 0 0 1 9-4.5" stroke="#fff" strokeWidth="3.4" opacity="0.65" fill="none" strokeLinecap="round"/></svg>);
  if(k==="star"||k==="clover"){
    if(k==="clover") return (<svg {...box}>{defs}{[[22,22],[42,22],[22,42],[42,42]].map(function(p,i){return <circle key={i} cx={p[0]} cy={p[1]} r="11.5" fill={F} stroke={S} strokeWidth="1.2"/>;})}<path d="M32 32v26" stroke="#1f7a3d" strokeWidth="3.6" strokeLinecap="round"/><circle cx="27" cy="19" r="3.2" fill="#fff" opacity="0.5"/></svg>);
    return (<svg {...box}>{defs}<path d="M32 3l9 19.5L61 25 46 39.5 50 60 32 49.5 14 60l4-20.5L3 25l20-2.5Z" fill={F} stroke={S} strokeWidth="1.6" strokeLinejoin="round"/><path d="M32 10l6 13 13 2-9.5 9.5 2.5 13-12-6.5Z" fill="#fff" opacity="0.25"/></svg>);
  }
  if(k==="shield") return (<svg {...box}>{defs}<path d="M32 4 56 13v22c0 14-11 22-24 25C19 57 8 49 8 35V13Z" fill={F} stroke={S} strokeWidth="1.7"/><path d="M32 10 50 16v18c0 11-8 17-18 20Z" fill="#fff" opacity="0.18"/><path d="M24 32l6 7 12-14" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  if(k==="lotus") return (<svg {...box}>{defs}<path d="M32 10c6 8 8 16 8 24-4 3-12 3-16 0 0-8 2-16 8-24Z" fill={F} stroke={S} strokeWidth="1.3"/><path d="M12 22c8 2 14 8 18 16-3 4-11 5-16 2-4-5-4-12-2-18Z" fill={F} stroke={S} strokeWidth="1.3"/><path d="M52 22c-8 2-14 8-18 16 3 4 11 5 16 2 4-5 4-12 2-18Z" fill={F} stroke={S} strokeWidth="1.3"/><path d="M6 38c10-2 20 2 26 10-6 5-18 5-24-1-3-3-3-6-2-9Z" fill={F} stroke={S} strokeWidth="1.3"/><path d="M58 38c-10-2-20 2-26 10 6 5 18 5 24-1 3-3 3-6 2-9Z" fill={F} stroke={S} strokeWidth="1.3"/><ellipse cx="32" cy="44" rx="6" ry="4" fill={c[0]}/></svg>);
  return (<svg {...box}>{defs}<rect x="8" y="8" width="48" height="48" rx="12" fill={F} stroke={S} strokeWidth="1.6"/><circle cx="24" cy="22" r="7" fill={R}/></svg>);
}
export function Jet({ size = 76, hue = "#E8B33C" }: { size?: number; hue?: string }) {
  return (<svg width={size} height={size*0.6} viewBox="0 0 100 60"><defs><linearGradient id="jb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fdf3d0"/><stop offset="60%" stopColor={hue}/><stop offset="100%" stopColor="#6b4a05"/></linearGradient><linearGradient id="jf" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff3c4"/><stop offset="55%" stopColor="#ff9f43"/><stop offset="100%" stopColor="#ff4757" stopOpacity="0"/></linearGradient></defs>
    <path d="M2 34h34l6-4-6-4H2Z" fill="url(#jf)"/>
    <path d="M30 30 72 22l22-9 6 3-14 12 14 12-6 3-22-9-42-4Z" fill="url(#jb)" stroke="#4a3405" strokeWidth="1.2"/>
    <path d="M52 27 40 12l8 1 16 14Z" fill={hue} stroke="#4a3405" strokeWidth="1"/>
    <path d="M52 33 40 48l8-1 16-14Z" fill={hue} stroke="#4a3405" strokeWidth="1"/>
    <ellipse cx="78" cy="26" rx="7" ry="4" fill="#8fd8ff" stroke="#12405e" strokeWidth="1"/>
    <path d="M84 30h12" stroke="#4a3405" strokeWidth="1.4"/></svg>);
}
export function Rocket({ size = 70, hue = "#E8B33C" }: { size?: number; hue?: string }) {
  return (<svg width={size*0.55} height={size} viewBox="0 0 44 80"><defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff8e0"/><stop offset="55%" stopColor={hue}/><stop offset="100%" stopColor="#6b4a05"/></linearGradient><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff3c4"/><stop offset="45%" stopColor="#ff9f43"/><stop offset="100%" stopColor="#ff4757" stopOpacity="0"/></linearGradient></defs>
    <path d="M16 62h12l-6 18Z" fill="url(#rf)"/>
    <path d="M22 2c9 9 13 22 13 36v22H9V38C9 24 13 11 22 2Z" fill="url(#rb)" stroke="#4a3405" strokeWidth="1.3"/>
    <path d="M9 44 1 62l8-3Z" fill={hue} stroke="#4a3405" strokeWidth="1"/>
    <path d="M35 44l8 18-8-3Z" fill={hue} stroke="#4a3405" strokeWidth="1"/>
    <circle cx="22" cy="28" r="6.5" fill="#8fd8ff" stroke="#12405e" strokeWidth="1.4"/>
    <path d="M13 52h18" stroke="#4a3405" strokeWidth="1.4"/></svg>);
}
export function Zeppelin({ size = 84, hue = "#E8B33C" }: { size?: number; hue?: string }) {
  return (<svg width={size} height={size*0.55} viewBox="0 0 100 55"><defs><linearGradient id="zb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff8e0"/><stop offset="55%" stopColor={hue}/><stop offset="100%" stopColor="#6b4a05"/></linearGradient></defs>
    <ellipse cx="48" cy="24" rx="44" ry="19" fill="url(#zb)" stroke="#4a3405" strokeWidth="1.4"/>
    <path d="M4 24h88" stroke="#4a3405" strokeWidth="1" opacity="0.5"/>
    <path d="M92 14l8-6v32l-8-6Z" fill={hue} stroke="#4a3405" strokeWidth="1"/>
    <rect x="36" y="42" width="24" height="10" rx="3" fill="#3a2a06" stroke="#4a3405"/>
    <path d="M42 42v-4M54 42v-4" stroke="#4a3405" strokeWidth="1.4"/>
    <ellipse cx="30" cy="16" rx="14" ry="5" fill="#fff" opacity="0.35"/></svg>);
}
export function Heli({ size = 80, hue = "#E8B33C" }: { size?: number; hue?: string }) {
  return (<svg width={size} height={size*0.6} viewBox="0 0 100 60"><defs><linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff8e0"/><stop offset="60%" stopColor={hue}/><stop offset="100%" stopColor="#6b4a05"/></linearGradient></defs>
    <rect x="6" y="12" width="88" height="4" rx="2" fill="#3a2a06"/>
    <rect x="46" y="14" width="4" height="10" fill="#3a2a06"/>
    <path d="M26 30c0-6 8-8 20-8h16c10 0 16 4 18 10l10 4-10 4c-2 6-8 8-18 8H40c-10 0-14-4-14-10Z" fill="url(#hb)" stroke="#4a3405" strokeWidth="1.3"/>
    <ellipse cx="62" cy="32" rx="9" ry="6" fill="#8fd8ff" stroke="#12405e" strokeWidth="1.2"/>
    <path d="M26 40h34" stroke="#4a3405" strokeWidth="1.4"/>
    <path d="M32 46h26" stroke="#3a2a06" strokeWidth="2.6"/></svg>);
}
