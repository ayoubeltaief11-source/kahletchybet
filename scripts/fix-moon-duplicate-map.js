const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
const lines = fs.readFileSync(f, "utf8").split("\n");
const oldLine = "{(inHoldWin ? hwSteps[hwStepIdx]?.grid : grid).map((col, c) =>";
let removed = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === oldLine) {
    console.log("Removing line " + (i+1) + ": [" + lines[i].trim() + "]");
    lines.splice(i, 1);
    removed++;
    i--;
  }
}
fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("Removed " + removed + " duplicate map line(s)");
