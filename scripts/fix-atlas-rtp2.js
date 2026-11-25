const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/engine.ts";
let t = fs.readFileSync(f, "utf8");

// 1. رفع المكافآت بمعامل ~8x من القيم الحالية
const newPays = `export const PAYS: Record<string, Record<number, number>> = {
  s1:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s2:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s3:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s4:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s5:{8:0.4,10:0.8,12:1.5,15:4,20:8,25:20,30:40},
  s6:{8:0.4,10:0.8,12:1.5,15:4,20:8,25:20,30:40},
  s7:{8:0.8,10:1.5,12:4,15:8,20:20,25:40,30:80},
  s8:{8:0.8,10:1.5,12:4,15:8,20:20,25:40,30:80},
  s9:{4:2,5:10,6:50}
};`;

t = t.replace(/export const PAYS: Record<string, Record<number, number>> = \{[\s\S]*?\};/, newPays);

// 2. زيادة أوزان كرات المضاعف قليلاً (من 5 إلى 8)
const newNormalWeights = `export const NORMAL_WEIGHTS: Record<SymId, number> = {
  s1:135, s2:125, s3:115, s4:105,
  s5:80, s6:65, s7:45, s8:30,
  s9:15, mult:8
};`;

t = t.replace(/export const NORMAL_WEIGHTS: Record<SymId, number> = \{[\s\S]*?\};/, newNormalWeights);

const newAnteWeights = `export const ANTE_WEIGHTS: Record<SymId, number> = {
  s1:135, s2:125, s3:115, s4:105,
  s5:80, s6:65, s7:45, s8:30,
  s9:35, mult:8
};`;

t = t.replace(/export const ANTE_WEIGHTS: Record<SymId, number> = \{[\s\S]*?\};/, newAnteWeights);

// 3. تعديل أوزان قيم المضاعفات (زيادة القيم المتوسطة)
const newMultWeights = `export const MULT_WEIGHTS: Record<number, number> = {
  2:450, 3:300, 5:180, 10:60, 25:15, 50:5
};`;

t = t.replace(/export const MULT_WEIGHTS: Record<number, number> = \{[\s\S]*?\};/, newMultWeights);

fs.writeFileSync(f, t, "utf8");
console.log("Engine adjusted: payouts raised ~8x, mult weight 8, target RTP 95-96.5%.");
