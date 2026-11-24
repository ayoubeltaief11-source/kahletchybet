const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
t = t.replace("facing?: \"left\" | \"right\"; baseAngle?: number; }", "facing?: \"left\" | \"right\"; baseAngle?: number; hideNear?: boolean; }");
const lines = t.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id: "skyward-jet"')) lines[i] = lines[i].replace(/facing: "[a-z]+", baseAngle: -?[0-9]+/, 'facing: "right", baseAngle: 0');
  if (lines[i].includes('id: "ember-rocket"')) lines[i] = lines[i].replace(/facing: "[a-z]+", baseAngle: -?[0-9]+/, 'facing: "right", baseAngle: -35');
  if (lines[i].includes('id: "drift-balloon"')) lines[i] = lines[i].replace(/facing: "[a-z]+", baseAngle: -?[0-9]+/, 'facing: "right", baseAngle: 0');
  if (lines[i].includes('id: "rotor-heli"')) lines[i] = lines[i].replace(/facing: "[a-z]+", baseAngle: -?[0-9]+/, 'facing: "right", baseAngle: 0').replace(/ },$/, ", hideNear: true },");
  if (lines[i].includes('id: "nightglide-stealth"')) lines[i] = lines[i].replace(/facing: "[a-z]+", baseAngle: -?[0-9]+/, 'facing: "right", baseAngle: 0').replace(/ },$/, ", hideNear: true },");
}
fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("right facing: " + (lines.join("\n").match(/facing: "right"/g) || []).length);
console.log("hideNear: " + (lines.join("\n").match(/hideNear: true/g) || []).length);
