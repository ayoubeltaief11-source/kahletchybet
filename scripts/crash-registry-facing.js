const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
t = t.replace("export interface GameRec { id: string; title: string; type: GType; pack: Pack; assetDir: string; color: string; color2: string; }", "export interface GameRec { id: string; title: string; type: GType; pack: Pack; assetDir: string; color: string; color2: string; facing?: \"left\" | \"right\"; baseAngle?: number; }");
const map = { "skyward-jet": ["left", 0], "ember-rocket": ["left", -90], "drift-balloon": ["right", -90], "rotor-heli": ["left", 0], "nightglide-stealth": ["left", 0] };
const lines = t.split("\n");
for (let i = 0; i < lines.length; i++) {
  for (const id of Object.keys(map)) {
    if (lines[i].includes("id: \"" + id + "\"") && !lines[i].includes("facing")) {
      lines[i] = lines[i].replace(/ },$/, ", facing: \"" + map[id][0] + "\", baseAngle: " + map[id][1] + " },");
    }
  }
}
fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("facing fields added: " + (lines.join("\n").match(/facing:/g) || []).length);
