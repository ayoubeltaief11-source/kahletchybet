const fs = require("fs");

// Falcon Dunes
const falcon = "src/kb3/slots/falcon-dunes/FalconGame.tsx";
if (fs.existsSync(falcon)) {
  let t = fs.readFileSync(falcon, "utf8");
  if (!t.includes("useBalance")) {
    t = t.replace(
      'import { sfx } from "../shared/sfx";',
      'import { sfx } from "../shared/sfx";\nimport { useBalance } from "@/lib/balance-context";'
    );
  }
  t = t.replace(
    'const [bal, setBal] = useState(1000);',
    'const { balance: bal, updateBalance: setBal } = useBalance();\n  const setBalFn = (fn: (b: number) => number) => { setBal(fn(bal) - bal); };'
  );
  // استبدال setBal(fn) بـ setBalFn(fn)
  t = t.replace(/setBal\(function\s*\(([^)]+)\)\s*\{/g, 'setBalFn(function($1){');
  fs.writeFileSync(falcon, t, "utf8");
  console.log("Falcon Dunes: balance unified");
}

// Atlas Skyfall
const atlas = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
if (fs.existsSync(atlas)) {
  let t = fs.readFileSync(atlas, "utf8");
  if (!t.includes("useBalance")) {
    t = t.replace(
      'import { sfx } from "../shared/sfx";',
      'import { sfx } from "../shared/sfx";\nimport { useBalance } from "@/lib/balance-context";'
    );
  }
  t = t.replace(
    'const [bal, setBal] = useState(0);',
    'const { balance: bal, updateBalance: setBal } = useBalance();\n  const setBalFn = (fn: (b: number) => number) => { setBal(fn(bal) - bal); };'
  );
  t = t.replace(/setBal\(function\s*\(([^)]+)\)\s*\{/g, 'setBalFn(function($1){');
  fs.writeFileSync(atlas, t, "utf8");
  console.log("Atlas Skyfall: balance unified");
}
