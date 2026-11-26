const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
// إضافة hold3 إلى GType
t = t.replace(/type GType = [^;]+;/, function (m) {
  return m.replace(/\};/, '"hold3"};');
});
fs.writeFileSync(f, t, "utf8");
console.log("hold3 added to GType: " + t.includes('"hold3"'));
