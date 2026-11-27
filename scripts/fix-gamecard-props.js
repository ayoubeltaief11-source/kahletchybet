const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
const broken = 'return <GameCard key={g.id} href={"/casino/" + g.id} name={g.name} badge="EXCLUSIVE" slug={g.id} cover={<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#2a9d8f,#e9c46a)",display:"grid",placeItems:"center",fontSize:24,fontWeight:900,color:"#fff"}}>{g.name}</div>} />';
const fixed = 'return <GameCard key={g.id} href={"/casino/" + g.id} name={g.name} tag="" badge="EXCLUSIVE" maxWin="" vol="" felt="" accent="#2a9d8f" slug={g.id} cover={<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#2a9d8f,#e9c46a)",display:"grid",placeItems:"center",fontSize:24,fontWeight:900,color:"#fff"}}>{g.name}</div>} />';
if (t.includes(broken)) {
  t = t.split(broken).join(fixed);
  fs.writeFileSync(f, t, "utf8");
  console.log("GameCard props fixed with default values");
} else {
  console.log("Pattern not found, checking line 87...");
  const lines = t.split("\n");
  if (lines[86]) console.log("Line 87: " + lines[86].substring(0, 200));
}
