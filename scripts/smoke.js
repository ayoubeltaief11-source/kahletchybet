const BASE = process.argv[2] || "http://localhost:3000";
const PAGES = ["/","/casino","/casino/slots","/casino/roulette","/casino/blackjack","/casino/blackjack2","/casino/crash-live","/casino/atlas-skyfall","/casino/falcon-dunes","/casino/moon-rabbit-mint","/casino/pitch-pulse","/casino/kb3-demo","/casino/falcon-dunes/debug","/casino/moon-rabbit-mint/debug","/casino/pitch-pulse/debug","/sports","/sports/football","/sports/basketball","/sports/tennis","/sports/live","/wallet","/dashboard","/login","/register","/learn","/legal/terms","/legal/privacy","/legal/responsible","/legal/simulation","/legal/integrations","/casino/mines/demo","/casino/plinko/demo","/casino/dice/demo","/casino/sky/demo","/casino/hold/demo","/casino/cluster/demo","/casino/lines/demo","/casino/mega/demo","/casino/instant/demo","/casino/sicbo/demo"];
const APIS = ["/api/games","/api/winners","/api/casino/rtp","/api/sports?sport=football","/api/auth/me"];
const UI_BAD = ["API key","_API_KEY","ODDS_API_KEY","quota reached","Simulation engine","Deposit","Withdraw","TD TD","â€","â†","Manchester","Arsenal","undefined","NaN"];
const API_BAD = ["_API_KEY","ODDS_API_KEY","API keys not configured","quota reached","Simulation engine","api_token=","apiKey="];
function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
}
let fails = 0, checked = 0;
async function hit(path, list, isApi) {
  checked++;
  let r, text = "";
  try { r = await fetch(BASE + path, { redirect: "manual" }); text = await r.text(); }
  catch (e) { console.log("FAIL " + path + " -> network " + e.message); fails++; return; }
  const okStatus = r.status === 200 || (isApi && (r.status === 401 || r.status === 403)) || (r.status >= 300 && r.status < 400);
  if (!okStatus) { console.log("FAIL " + path + " -> HTTP " + r.status); fails++; }
  const body = isApi ? text : visible(text);
  const found = list.filter(function (w) { return body.indexOf(w) >= 0; });
  if (found.length) { console.log("FAIL " + path + " -> forbidden: " + found.join(", ")); fails++; }
  else if (okStatus) { console.log("ok   " + path + "  " + r.status); }
}
(async function () {
  console.log("SMOKE TARGET " + BASE);
  for (const p of PAGES) await hit(p, UI_BAD, false);
  for (const p of APIS) await hit(p, API_BAD, true);
  console.log("---");
  console.log("checked " + checked + " | failures " + fails);
  process.exit(fails > 0 ? 1 : 0);
})();
