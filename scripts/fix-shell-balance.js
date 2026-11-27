const fs = require("fs");
const f = "components/Shell.tsx";
let t = fs.readFileSync(f, "utf8");
// 1) إضافة الاستيراد إن كان غائباً
if (!t.includes('from "@/lib/balance-context"')) {
  t = t.replace(/import\s+\{[^}]*\}\s+from\s+"@\/components\/Shell";?/, function (m) {
    return m + '\nimport { BalanceProvider } from "@/lib/balance-context";';
  });
  // إن لم يجد نمط import من Shell نفسه، يضيفه بعد أول import
  if (!t.includes('from "@/lib/balance-context"')) {
    const firstImport = t.match(/import\s+[^;]+;/);
    if (firstImport) t = t.replace(firstImport[0], firstImport[0] + '\nimport { BalanceProvider } from "@/lib/balance-context";');
  }
}
// 2) تغليف children بـBalanceProvider
if (!t.includes("<BalanceProvider>")) {
  // البحث عن {children} داخل main
  t = t.replace(/<main([^>]*)>\s*\{children\}\s*<\/main>/, '<main$1><BalanceProvider>{children}</BalanceProvider></main>');
  // إن لم يجد، يلفه يدوياً
  if (!t.includes("<BalanceProvider>")) {
    t = t.replace(/\{children\}/, "<BalanceProvider>{children}</BalanceProvider>");
  }
}
fs.writeFileSync(f, t, "utf8");
console.log("Shell.tsx fixed: import=" + t.includes('from "@/lib/balance-context"') + " wrap=" + t.includes("<BalanceProvider>"));
