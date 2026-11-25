const fs = require("fs");
const fe = "src/kb3/slots/atlas-skyfall/engine.ts";
let e = fs.readFileSync(fe, "utf8");
e = e.split("sum += grid[c]![r]!.mult;").join("sum += (grid[c]![r]!.mult || 0);");
e = e.split("grid[c]![r]!.mult)").join("(grid[c]![r]!.mult || 0))");
fs.writeFileSync(fe, e, "utf8");
console.log("mult guard applied");
