const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/engine.ts";
let t = fs.readFileSync(f, "utf8");

// 1. إضافة خريطة الدمج الآمنة بعد تعريف COIN_VALS
const mergeMap = `
export const MERGE_MAP: Record<string, CoinId> = {
  "c5": "c10", "c10": "c25", "c25": "c50", "c50": "c100", "c100": "c250", "c250": "minor"
};
`;
if (!t.includes("MERGE_MAP")) {
  t = t.replace("export const COIN_VALS: Record<CoinId, number> = {", mergeMap + "export const COIN_VALS: Record<CoinId, number> = {");
}

// 2. إصلاح منطق الدمج ليستخدم الخريطة بدلاً من الحساب الرياضي المعرّض للخطأ
const oldMergeLogic = `let newSym: CoinId = (typeof cell.sym === 'string' && cell.sym.startsWith('c')) ? cell.sym as CoinId : 'c5';
            const val = COIN_VALS[cell.sym]! * 2;
            // Simple mapping for doubled standard coins
            if (val <= 25) newSym = ("c" + (val * 10)) as CoinId; // rough mapping, simplified for engine
            else if (val === 50) newSym = "c50";
            else if (val === 100) newSym = "minor";
            else if (val === 200) newSym = "major";
            else if (val >= 500) newSym = "grand";`;

const newMergeLogic = `let newSym: CoinId = MERGE_MAP[cell.sym] || "c250";`;

if (t.includes(oldMergeLogic)) {
  t = t.replace(oldMergeLogic, newMergeLogic);
  console.log("Merge logic safely mapped to valid CoinIds.");
} else {
  console.log("Merge logic already updated or pattern not found. Checking manually...");
}

fs.writeFileSync(f, t, "utf8");
