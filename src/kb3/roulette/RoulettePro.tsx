"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { rouletteBySlug } from "@/lib/kb2/rouletteMath";
import WheelPro from "./WheelPro";
import TablePro from "./TablePro";
import { GameCharacter } from "@/lib/kb2/imageLoader";

const THEMES: Record<string, {felt:string;wood:string;glow:string;light:string}> = {
  "emerald-roulette": {felt:"#0a3a24",wood:"#3d2b10",glow:"#0c7a4e",light:"rgba(12,122,78,.3)"},
  "crimson-roulette": {felt:"#3a0808",wood:"#2a1008",glow:"#c4202f",light:"rgba(196,32,47,.25)"},
  "royal-velvet": {felt:"#2a0a4a",wood:"#4a3010",glow:"#8b5cf6",light:"rgba(139,92,246,.25)"},
  "midnight-wheel": {felt:"#0a1430",wood:"#1a2040",glow:"#3b82f6",light:"rgba(59,130,246,.2)"},
  "golden-crown": {felt:"#1a1408",wood:"#5a4010",glow:"#eab308",light:"rgba(234,179,8,.3)"}
};

let actx: AudioContext | null = null;
function ac(): AudioContext { if(!actx) actx = new (window.AudioContext||(window as any).webkitAudioContext)(); return actx; }
function ping(f:number,d:number,v:number,w:number){const c=ac(),t=c.currentTime+w,o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.type="sine";g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d);}
function playSpin(){ping(120,.8,.12,0);ping(200,.6,.08,.1);}
function playClick(i:number){ping(800+i*40,.04,.09,0);}
function playBounce(){ping(400,.08,.15,0);ping(600,.06,.1,.05);}
function playLand(){ping(200,.3,.2,0);ping(150,.4,.12,.05);}
function playWin(){[523,659,784,1046].forEach(function(f,i){ping(f,.2,.15,i*.08);});}
function playLose(){ping(300,.3,.1,0);ping(200,.4,.08,.1);}

interface Props { slug: string; }

export default function RoulettePro({ slug }: Props) {
  const cfg = rouletteBySlug(slug);
  const th = THEMES[slug] || THEMES["emerald-roulette"];
  const [bets, setBets] = useState<Record<string, number>>({});
  const [chip, setChip] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const lastBets = useRef<Record<string, number>>({});

  const placeBet = useCallback(function(k: string) {
    if (spinning) return;
    setBets(function(b) { return Object.assign({}, b, {[k]: (b[k]||0) + chip}); });
  }, [spinning, chip]);

  const spin = useCallback(function() {
    if (spinning || Object.keys(bets).length === 0) return;
    lastBets.current = Object.assign({}, bets);
    setSpinning(true);
    setResult(null);
    playSpin();
    const num = Math.floor(Math.random() * 37);
    window.setTimeout(function() {
      setResult(num);
      setHistory(function(h) { return [num].concat(h).slice(0, 20); });
      setSpinning(false);
      playLand();
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].indexOf(num) >= 0;
      let won = 0;
      Object.entries(bets).forEach(function([k,v]) {
        if (k === "n"+num) won += v * 35;
        else if (k === "n0" && num === 0) won += v * 35;
        else if (k === "red" && isRed) won += v * 2;
        else if (k === "black" && !isRed && num !== 0) won += v * 2;
        else if (k === "even" && num > 0 && num % 2 === 0) won += v * 2;
        else if (k === "odd" && num % 2 === 1) won += v * 2;
        else if (k === "low" && num >= 1 && num <= 18) won += v * 2;
        else if (k === "high" && num >= 19) won += v * 2;
        else if (k === "d1" && num >= 1 && num <= 12) won += v * 3;
        else if (k === "d2" && num >= 13 && num <= 24) won += v * 3;
        else if (k === "d3" && num >= 25) won += v * 3;
        else if (k === "c1" && num > 0 && num % 3 === 1) won += v * 3;
        else if (k === "c2" && num > 0 && num % 3 === 2) won += v * 3;
        else if (k === "c3" && num > 0 && num % 3 === 0) won += v * 3;
      });
      if (won > 0) playWin(); else playLose();
    }, 7500);
  }, [spinning, bets, chip]);

  useEffect(function() {
    try { if (localStorage.getItem("kr_hide_"+slug)==="1") setShowIntro(false); } catch(e){}
  }, [slug]);

  if (showIntro) {
    return (
      <div className="kp-intro" style={{background: "linear-gradient(rgba(5,8,14,.7),rgba(5,8,14,.85)), url(/assets/"+slug+"/bg.jpg)", backgroundSize:"cover"}}>
        <GameCharacter slug={slug} hue={th.glow} size={180} mood="idle"/>
        <img src={"/assets/"+slug+"/logo.png"} alt="" className="kp-intro-logo" onError={function(e){e.currentTarget.style.display="none";}}/>
        <h2>{cfg.name}</h2>
        <p>RTP {(cfg.rtp*100).toFixed(1)}% | Max x36 | {cfg.tag}</p>
        <button className="kp-play-btn" onClick={function(){setShowIntro(false);}}>PLAY NOW</button>
        <label className="kp-hide"><input type="checkbox" onChange={function(e){if(e.target.checked){try{localStorage.setItem("kr_hide_"+slug,"1");}catch(x){}}}} /> Don't show again</label>
      </div>
    );
  }

  return (
    <div className="kp-pro" style={{["--glow" as string]: th.glow, ["--felt" as string]: th.felt, ["--wood" as string]: th.wood, ["--light" as string]: th.light}}>
      <div className="kp-header">
        <img src={"/assets/"+slug+"/logo.png"} alt="" className="kp-hlogo" onError={function(e){e.currentTarget.style.display="none";}}/>
        <b>{cfg.name}</b>
        <div className="kp-history">{history.slice(0,12).map(function(n,i){return <span key={i} className={"kp-hn "+([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].indexOf(n)>=0?"r":"b")+(n===0?" g":"")}>{n}</span>;})}</div>
      </div>
      <div className="kp-wheel-area">
        <WheelPro number={result||0} spinning={spinning} hue={th.glow} hue2={cfg.accent2} onLand={function(){}}/>
        <div className="kp-mascot"><GameCharacter slug={slug} hue={th.glow} size={140} mood={spinning?"idle":"idle"}/></div>
      </div>
      <TablePro bets={bets} chip={chip} spinning={spinning} lastNumber={result} onBet={placeBet} onChip={setChip} onUndo={function(){setBets({});}} onClear={function(){setBets({});}} onRebet={function(){setBets(Object.assign({},lastBets.current));}} onDouble={function(){const n:Record<string,number>={};Object.entries(bets).forEach(function([k,v]){n[k]=v*2;});setBets(n);}}/>
      <button className="kp-spin-btn" onClick={spin} disabled={spinning||Object.keys(bets).length===0}>{spinning?"...":"SPIN"}</button>
    </div>
  );
}
