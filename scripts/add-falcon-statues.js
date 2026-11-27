const fs = require("fs");
const f = "src/kb3/slots/falcon-dunes/FalconGame.tsx";
let t = fs.readFileSync(f, "utf8");

// إضافة falcon statues قبل fd-frame
const statues = `
      <img className="fd-statue left" src={A + "falcon-statue.png"} alt="" onError={hide}/>
      <img className="fd-statue right" src={A + "falcon-statue.png"} alt="" onError={hide}/>`;

if (!t.includes("fd-statue")) {
  t = t.replace('<div className="fd-frame">', statues + '\n      <div className="fd-frame">');
}

fs.writeFileSync(f, t, "utf8");
console.log("Falcon statues added to frame corners");
