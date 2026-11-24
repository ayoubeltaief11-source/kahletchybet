const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");

// 1. إزالة العرض الثابت من JSX ليتحكم به الـ loop
t = t.replace('style={{ opacity: 0, width: "16%" }}', 'style={{ opacity: 0 }}');

// 2. تحديث موضع وحجم الشخصية في الـ loop
const oldStyle = `        el.style.left = pos.x + "%";
        el.style.top = fy + "%";
        el.style.transform = "translate(-50%,-50%) rotate(" + rot.toFixed(2) + "deg) scaleX(" + flip + ")";
        el.style.opacity = String((imgOkRef.current ? 1 : 0) * (1 - st.fall));`;

const newStyle = `        const isBetting = st.phase === "betting";
        el.style.left = (isBetting ? 50 : pos.x) + "%";
        el.style.top = (isBetting ? 85 : fy) + "%";
        el.style.width = isBetting ? "22%" : "18%";
        el.style.transform = "translate(-50%,-50%) rotate(" + rot.toFixed(2) + "deg) scaleX(" + flip + ")";
        el.style.opacity = String((imgOkRef.current ? 1 : 0) * (1 - st.fall));`;

if (t.includes(oldStyle)) {
  t = t.replace(oldStyle, newStyle);
  fs.writeFileSync(f, t, "utf8");
  console.log("DONE: Character position and size updated (22% betting center-bottom, 18% flying).");
} else {
  console.log("WARN: Could not find exact style block. Manual check required.");
}
