const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
// البحث عن تعريف Pack وإضافة "sports" إليه
const packMatch = t.match(/export type Pack = [^;]+;/);
if (packMatch) {
  const newPack = packMatch[0].replace(";", ' | "sports";');
  t = t.replace(packMatch[0], newPack);
  fs.writeFileSync(f, t, "utf8");
  console.log("Pack type updated to include 'sports'");
} else {
  console.log("Pack type not found. Checking current types...");
  const typeMatch = t.match(/export type \w+ = [^;]+;/g);
  console.log(typeMatch ? typeMatch.join("\n") : "No types found");
}
