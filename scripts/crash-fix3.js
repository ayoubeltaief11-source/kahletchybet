const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.replace('<b className="kb3-title">{cfg.name}</b>', '<b className="kb3-title">{cfg.name} <span className="kb3-live-tag">LIVE</span></b>');
fs.writeFileSync(f, t, "utf8");
console.log("LIVE tag: " + t.includes("kb3-live-tag"));
