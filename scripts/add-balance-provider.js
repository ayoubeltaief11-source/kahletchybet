const fs = require("fs");
const f = "components/Shell.tsx";
let t = fs.readFileSync(f, "utf8");

// إضافة import
if (!t.includes("BalanceProvider")) {
  t = t.replace(
    'import { tr, fmt } from "@/lib/catalog";',
    'import { tr, fmt } from "@/lib/catalog";\nimport { BalanceProvider } from "@/lib/balance-context";'
  );
}

// تغليف children بـBalanceProvider
if (!t.includes("<BalanceProvider>")) {
  t = t.replace(
    /<main[^>]*>\s*\{children\}\s*<\/main>/,
    '<main className="main"><BalanceProvider>{children}</BalanceProvider></main>'
  );
}

fs.writeFileSync(f, t, "utf8");
console.log("BalanceProvider added to Shell.tsx");
