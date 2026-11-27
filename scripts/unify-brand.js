const fs = require("fs");
const targets = ["app/layout.tsx", "components/Shell.tsx"];
const BAD = [/kahletchy/gi, /kahltchy/gi, /Kahlatchy/g];
const GOOD = "kahlatchybet";
for (const t of targets) {
  if (!fs.existsSync(t)) { console.log("skip " + t); continue; }
  let c = fs.readFileSync(t, "utf8");
  let changed = false;
  for (const b of BAD) {
    if (b.test(c)) { c = c.replace(b, GOOD); changed = true; }
  }
  if (changed) { fs.writeFileSync(t, c, "utf8"); console.log("Unified brand in " + t); }
  else console.log("Brand clean in " + t);
}
