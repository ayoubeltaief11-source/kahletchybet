const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/engine.ts";
let t = fs.readFileSync(f, "utf8");

// 1. تحديث مكافآت الرموز لتكون متناسبة مع RTP 96%
const newPays = `export const PAYS: Record<string, Record<number, number>> = {
  s1:{8:0.02,10:0.05,12:0.1,15:0.2,20:0.5,25:1,30:2},
  s2:{8:0.02,10:0.05,12:0.1,15:0.2,20:0.5,25:1,30:2},
  s3:{8:0.02,10:0.05,12:0.1,15:0.2,20:0.5,25:1,30:2},
  s4:{8:0.02,10:0.05,12:0.1,15:0.2,20:0.5,25:1,30:2},
  s5:{8:0.05,10:0.1,12:0.2,15:0.5,20:1,25:2,30:5},
  s6:{8:0.05,10:0.1,12:0.2,15:0.5,20:1,25:2,30:5},
  s7:{8:0.1,10:0.2,12:0.5,15:1,20:2,25:5,30:10},
  s8:{8:0.1,10:0.2,12:0.5,15:1,20:2,25:5,30:10},
  s9:{4:0.5,5:2,6:10}
};`;

t = t.replace(/export const PAYS: Record<string, Record<number, number>> = \{[\s\S]*?\};/, newPays);

// 2. تقليل تكرار كرات المضاعف وجعل القيم الكبيرة نادرة جداً
const newNormalWeights = `export const NORMAL_WEIGHTS: Record<SymId, number> = {
  s1:140, s2:130, s3:120, s4:110,
  s5:85, s6:70, s7:50, s8:35,
  s9:15, mult:5
};`;

t = t.replace(/export const NORMAL_WEIGHTS: Record<SymId, number> = \{[\s\S]*?\};/, newNormalWeights);

const newAnteWeights = `export const ANTE_WEIGHTS: Record<SymId, number> = {
  s1:140, s2:130, s3:120, s4:110,
  s5:85, s6:70, s7:50, s8:35,
  s9:35, mult:5
};`;

t = t.replace(/export const ANTE_WEIGHTS: Record<SymId, number> = \{[\s\S]*?\};/, newAnteWeights);

// 3. تعديل أوزان قيم المضاعفات لتكون واقعية
const newMultWeights = `export const MULT_WEIGHTS: Record<number, number> = {
  2:500, 3:300, 5:150, 10:40, 25:8, 50:2
};`;

t = t.replace(/export const MULT_WEIGHTS: Record<number, number> = \{[\s\S]*?\};/, newMultWeights);

fs.writeFileSync(f, t, "utf8");
console.log("Engine weights and payouts adjusted for ~96% RTP.");
