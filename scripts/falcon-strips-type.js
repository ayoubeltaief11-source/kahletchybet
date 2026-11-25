const fs = require("fs");
const f = "src/kb3/slots/falcon-dunes/FalconGame.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.split("const [strips, setStrips] = useState<Cell[][][]>(").join("const [strips, setStrips] = useState<Cell[][]>(");
fs.writeFileSync(f, t, "utf8");
console.log("strips type fixed: " + t.includes("useState<Cell[][]>(function () {\n    const g = makeGrid") || t.includes("useState<Cell[][]>("));
