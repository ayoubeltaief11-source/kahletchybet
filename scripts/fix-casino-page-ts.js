const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");

// البحث عن السطر المعطوب وإصلاحه
const brokenLine = 'return <GameCard key={g.id} href={"/casino/" + g.id} name={g.name} tag={g.tag} badge="EXCLUSIVE" maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.color} slug={g.id} cover={<GameCoverSvg gameId={g.id} type={g.type} color={g.color} color2={g.color2} title={g.name} maxWin={g.maxWin}/>} />;';

const fixedLine = 'return <GameCard key={g.id} href={"/casino/" + g.id} name={g.name} badge="EXCLUSIVE" slug={g.id} cover={<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#2a9d8f,#e9c46a)",display:"grid",placeItems:"center",fontSize:24,fontWeight:900,color:"#fff"}}>{g.name}</div>} />;';

if (t.includes(brokenLine)) {
  t = t.split(brokenLine).join(fixedLine);
  fs.writeFileSync(f, t, "utf8");
  console.log("Fixed New Exclusives section - removed non-existent KBGame properties");
} else {
  console.log("Pattern not found, checking line 87...");
  const lines = t.split("\n");
  if (lines[86]) console.log("Line 87: " + lines[86].substring(0, 150));
}
