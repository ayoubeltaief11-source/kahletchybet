const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// 1) إضافة AUTO state إن لم يكن موجوداً
if (!t.includes("autoLeft")) {
  t = t.replace(
    'const [intro, setIntro] = useState(true);',
    'const [intro, setIntro] = useState(true);\n  const [autoLeft, setAutoLeft] = useState(0);'
  );
}

// 2) إضافة AUTO effect
if (!t.includes("autoLeft <= 0")) {
  const autoEffect = `
  useEffect(() => {
    if (autoLeft <= 0 || spinning || inHoldWin || bigWin) return;
    const tt = setTimeout(() => {
      setAutoLeft(a => a - 1);
      spin();
    }, 700);
    return () => clearTimeout(tt);
  }, [autoLeft, spinning, inHoldWin, bigWin]);`;
  t = t.replace('}, []);', '}, []);\n' + autoEffect);
}

// 3) إضافة زر AUTO في الـ footer
if (!t.includes("mm-auto")) {
  t = t.replace(
    '<button className="mm-turbo"',
    '<button className="mm-auto" onClick={() => setAutoLeft(autoLeft > 0 ? 0 : 10)}>{autoLeft > 0 ? "AUTO " + autoLeft : "AUTO"}</button>\n        <button className="mm-turbo"'
  );
}

fs.writeFileSync(f, t, "utf8");
console.log("Moon Rabbit: AUTO feature added");
