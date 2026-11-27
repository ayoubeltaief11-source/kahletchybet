const fs = require("fs");
const f = "app/wallet/page.tsx";
let t = fs.readFileSync(f, "utf8");

// إزالة modal state
t = t.replace(/const \[modal, setModal\] = useState<"DEPOSIT" \| "WITHDRAW" \| null>\(null\);/, '// DEPOSIT/WITHDRAW moved to /admin/td');

// إزالة amount state
t = t.replace(/const \[amount, setAmount\] = useState\("1000"\);/, '// amount state removed');

// إزالة method state
t = t.replace(/const \[method, setMethod\] = useState\("Demo Card"\);/, '// method state removed');

// إزالة submit function
t = t.replace(/const submit = async \(\) => \{[\s\S]*?toast\(`\$\{modal === "DEPOSIT" \? "Credited" : "Debited"\} \$\{fmt\(a\)\}  simulation only`, "j"\);\n  \};/, '// submit function removed - use /admin/td for demo operations');

// إزالة أزرار DEPOSIT/WITHDRAW من الواجهة
t = t.replace(/<button className="card hov pad"[^>]*>[\s\S]*?Adds virtual credits[\s\S]*?<\/button>/, '<!-- DEPOSIT button moved to /admin/td -->');
t = t.replace(/<button className="card hov pad"[^>]*>[\s\S]*?Withdraw[\s\S]*?<\/button>/, '<!-- WITHDRAW button moved to /admin/td -->');

// إزالة tabs DEPOSIT/WITHDRAW
t = t.replace(/\["ALL", "DEPOSIT", "WITHDRAW", "BET"\]/, '["ALL", "BET"]');

// إزالة modal JSX
t = t.replace(/\{modal && \([\s\S]*?<\/div>\)\}/, '{/* Modal moved to /admin/td */}');

fs.writeFileSync(f, t, "utf8");
console.log("DEPOSIT/WITHDRAW removed from wallet page (kept in /admin/td)");
