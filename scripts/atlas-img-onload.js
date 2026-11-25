const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
let t = fs.readFileSync(f, "utf8");
t = t.split("onLoadedData={function () { setImgOk(true); }}").join("onLoad={function () { setImgOk(true); }}");
t = t.split('src="/assets/atlas-skyfall/character.png"').join('src="/assets/atlas-skyfall/character.png?v=2"');
t = t.split('src="/assets/atlas-skyfall/character-cast.png"').join('src="/assets/atlas-skyfall/character-cast.png?v=2"');
fs.writeFileSync(f, t, "utf8");
console.log("img onLoad fixed: " + t.includes("onLoad={function () { setImgOk(true); }}"));
