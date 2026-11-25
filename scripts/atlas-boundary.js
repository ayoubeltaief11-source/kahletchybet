const fs = require("fs");
const f = "app/casino/atlas-skyfall/page.tsx";
let t = fs.readFileSync(f, "utf8");
if (!t.includes("Boundary")) {
  t = t.replace('import ClientOnly from "@/components/kb2/ClientOnly";', 'import ClientOnly from "@/components/kb2/ClientOnly";\nimport Boundary from "@/src/kb3/slots/atlas-skyfall/Boundary";');
  t = t.replace("<ClientOnly minHeight={520}><AtlasGame/></ClientOnly>", "<ClientOnly minHeight={520}><Boundary><AtlasGame/></Boundary></ClientOnly>");
  fs.writeFileSync(f, t, "utf8");
  console.log("boundary wired");
} else console.log("already");
