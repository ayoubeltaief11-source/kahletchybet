/* Entertainment simulation engine.
   Every value produced here is clearly labelled SIMULATED in the UI.
   Probabilities are mathematically coherent (Poisson goal model + margin). */

export interface SimPick { label: string; price: number }
export interface SimMarket { key: string; name: string; group: string; picks: SimPick[] }
export interface SimFixture {
  id: string; sport: string; league: string; leagueLogo: string;
  home: string; away: string; homeLogo: string; awayLogo: string;
  kickoff: string; state: "LIVE" | "UPCOMING" | "FINISHED";
  minute: number | null; scoreHome: number | null; scoreAway: number | null;
  markets: SimMarket[]; provider: string; updated: number; simulated: true;
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: string) { let x = hash(seed) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const pois = (l: number, k: number) => (Math.pow(l, k) * Math.exp(-l)) / fact(k);
const MARGIN = 1.07;
const price = (p: number) => Math.max(1.02, Math.round((1 / Math.max(p, 0.004)) / MARGIN * 100) / 100);

const TEAMS: Record<string, [string, string, string][]> = {
  football: [
    ["Manchester City", "Arsenal", "Premier League"], ["Liverpool", "Chelsea", "Premier League"],
    ["Real Madrid", "Barcelona", "LaLiga"], ["Atletico Madrid", "Sevilla", "LaLiga"],
    ["Inter", "Juventus", "Serie A"], ["AC Milan", "Napoli", "Serie A"],
    ["Bayern Munich", "Dortmund", "Bundesliga"], ["Leipzig", "Leverkusen", "Bundesliga"],
    ["Paris SG", "Marseille", "Ligue 1"], ["Lyon", "Monaco", "Ligue 1"],
    ["Esperance ST", "Club Africain", "Ligue 1 Tunisie"], ["Etoile Sahel", "CS Sfaxien", "Ligue 1 Tunisie"],
    ["Al Ahly", "Zamalek", "Egyptian Premier League"], ["Wydad", "Raja", "Botola Pro"],
    ["Al Hilal", "Al Nassr", "Saudi Pro League"], ["Benfica", "Porto", "Primeira Liga"],
  ],
  basketball: [["Lakers", "Celtics", "NBA"], ["Warriors", "Nuggets", "NBA"], ["Heat", "Bucks", "NBA"], ["Real Madrid", "Panathinaikos", "EuroLeague"], ["Monaco", "Fenerbahce", "EuroLeague"]],
  tennis: [["Alcaraz", "Sinner", "ATP Masters"], ["Djokovic", "Zverev", "ATP 500"], ["Swiatek", "Sabalenka", "WTA 1000"], ["Gauff", "Rybakina", "WTA 500"]],
  volleyball: [["Perugia", "Trento", "SuperLega"], ["Zenit", "Jastrzebski", "CEV Champions League"], ["Poland", "Italy", "Nations League"]],
  baseball: [["Yankees", "Dodgers", "MLB"], ["Astros", "Braves", "MLB"], ["Red Sox", "Padres", "MLB"]],
  hockey: [["Rangers", "Bruins", "NHL"], ["Oilers", "Avalanche", "NHL"], ["Maple Leafs", "Canadiens", "NHL"]],
  mma: [["Jones", "Aspinall", "UFC Heavyweight"], ["Makhachev", "Topuria", "UFC Lightweight"], ["Adesanya", "Du Plessis", "UFC Middleweight"]],
  esports: [["NAVI", "FaZe", "CS2 BLAST"], ["Vitality", "G2", "CS2 IEM"], ["T1", "Gen.G", "LoL LCK"], ["G2", "Fnatic", "LoL LEC"], ["Team Spirit", "Falcons", "Dota 2 TI"]],
};

export function buildMarkets(seed: string, sport: string, home: string, away: string): SimMarket[] {
  const r = rng(seed);
  const twoWay = sport !== "football" && sport !== "volleyball" && sport !== "hockey";
  const lh = 0.9 + r() * 1.7, la = 0.7 + r() * 1.5;
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const p = pois(lh, i) * pois(la, j);
    if (i > j) pH += p; else if (i === j) pD += p; else pA += p;
  }
  if (twoWay) { pH = pH / (pH + pA); pA = 1 - pH; pD = 0; }
  const tot = pH + pD + pA; pH /= tot; pA /= tot; pD /= tot;

  const m: SimMarket[] = [];
  m.push({ key: "1x2", name: twoWay ? "Match Winner" : "Match Result (1X2)", group: "Main",
    picks: twoWay ? [{ label: home, price: price(pH) }, { label: away, price: price(pA) }]
      : [{ label: "1", price: price(pH) }, { label: "X", price: price(pD) }, { label: "2", price: price(pA) }] });

  if (!twoWay) {
    m.push({ key: "dc", name: "Double Chance", group: "Main",
      picks: [{ label: "1X", price: price(pH + pD) }, { label: "12", price: price(pH + pA) }, { label: "X2", price: price(pD + pA) }] });
    m.push({ key: "dnb", name: "Draw No Bet", group: "Main",
      picks: [{ label: home, price: price(pH / (pH + pA)) }, { label: away, price: price(pA / (pH + pA)) }] });
  }

  const lines = sport === "basketball" ? [199.5, 209.5, 219.5, 229.5] : sport === "tennis" ? [20.5, 22.5, 24.5] : [1.5, 2.5, 3.5, 4.5];
  const totalPicks: SimPick[] = [];
  for (const ln of lines) {
    let under = 0;
    if (sport === "football" || sport === "volleyball" || sport === "hockey") {
      for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) if (i + j < ln) under += pois(lh, i) * pois(la, j);
    } else under = 0.36 + r() * 0.28;
    under = Math.min(0.94, Math.max(0.06, under));
    totalPicks.push({ label: `Over ${ln}`, price: price(1 - under) }, { label: `Under ${ln}`, price: price(under) });
  }
  m.push({ key: "totals", name: "Total (Over / Under)", group: "Totals", picks: totalPicks });

  const hcp = sport === "basketball" ? [-9.5, -5.5, 5.5, 9.5] : [-1.5, -0.5, 0.5, 1.5];
  const hp: SimPick[] = [];
  for (const h of hcp) {
    const shift = Math.min(0.9, Math.max(0.1, pH + (h < 0 ? -0.16 * Math.abs(h) : 0.16 * Math.abs(h))));
    hp.push({ label: `${home} ${h > 0 ? "+" : ""}${h}`, price: price(shift) }, { label: `${away} ${h > 0 ? "-" : "+"}${Math.abs(h)}`, price: price(1 - shift) });
  }
  m.push({ key: "handicap", name: "Handicap", group: "Handicap", picks: hp });

  if (!twoWay) {
    const pBtts = (1 - pois(lh, 0)) * (1 - pois(la, 0));
    m.push({ key: "btts", name: "Both Teams To Score", group: "Goals", picks: [{ label: "Yes", price: price(pBtts) }, { label: "No", price: price(1 - pBtts) }] });
    let odd = 0; for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) if ((i + j) % 2 === 1) odd += pois(lh, i) * pois(la, j);
    m.push({ key: "oe", name: "Odd / Even Goals", group: "Goals", picks: [{ label: "Odd", price: price(odd) }, { label: "Even", price: price(1 - odd) }] });
    m.push({ key: "teamgoals", name: "Team Total Goals", group: "Goals", picks: [
      { label: `${home} Over 1.5`, price: price(1 - pois(lh, 0) - pois(lh, 1)) },
      { label: `${home} Under 1.5`, price: price(pois(lh, 0) + pois(lh, 1)) },
      { label: `${away} Over 1.5`, price: price(1 - pois(la, 0) - pois(la, 1)) },
      { label: `${away} Under 1.5`, price: price(pois(la, 0) + pois(la, 1)) }] });
    const cs: SimPick[] = [];
    for (const [i, j] of [[1,0],[2,0],[2,1],[0,0],[1,1],[0,1],[0,2],[1,2],[3,0],[3,1]]) cs.push({ label: `${i} - ${j}`, price: price(pois(lh, i) * pois(la, j)) });
    m.push({ key: "cs", name: "Correct Score", group: "Score", picks: cs });
    const fh = lh * 0.42, fa = la * 0.42;
    let h1 = 0, d1 = 0, a1 = 0;
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) { const p = pois(fh, i) * pois(fa, j); if (i > j) h1 += p; else if (i === j) d1 += p; else a1 += p; }
    const t1 = h1 + d1 + a1;
    m.push({ key: "ht", name: "Half Time Result", group: "Halves", picks: [{ label: "1", price: price(h1 / t1) }, { label: "X", price: price(d1 / t1) }, { label: "2", price: price(a1 / t1) }] });
    m.push({ key: "htft", name: "Half Time / Full Time", group: "Halves", picks: [
      { label: "1/1", price: price(pH * 0.55) }, { label: "X/1", price: price(pH * 0.26) }, { label: "2/2", price: price(pA * 0.55) },
      { label: "X/2", price: price(pA * 0.26) }, { label: "X/X", price: price(pD * 0.5) }, { label: "1/X", price: price(pD * 0.25) }] });
    m.push({ key: "firstgoal", name: "First Team To Score", group: "Goals", picks: [
      { label: home, price: price(pH * 0.86 + 0.06) }, { label: away, price: price(pA * 0.86 + 0.06) }, { label: "No goal", price: price(pois(lh, 0) * pois(la, 0)) }] });
    m.push({ key: "corners", name: "Total Corners", group: "Stats", picks: [
      { label: "Over 8.5", price: price(0.55) }, { label: "Under 8.5", price: price(0.45) },
      { label: "Over 10.5", price: price(0.34) }, { label: "Under 10.5", price: price(0.66) }] });
    m.push({ key: "cards", name: "Total Cards", group: "Stats", picks: [
      { label: "Over 3.5", price: price(0.58) }, { label: "Under 3.5", price: price(0.42) },
      { label: "Over 5.5", price: price(0.27) }, { label: "Under 5.5", price: price(0.73) }] });
  } else {
    m.push({ key: "sets", name: "Total Sets / Rounds", group: "Totals", picks: [
      { label: "Over 2.5", price: price(0.52) }, { label: "Under 2.5", price: price(0.48) }] });
  }
  return m;
}

export function simFixtures(sport: string, scope: string): SimFixture[] {
  const rows = TEAMS[sport] ?? TEAMS.football;
  const base = Date.now();
  const out: SimFixture[] = rows.map((t, i) => {
    const id = `sim-${sport}-${i}`;
    const r = rng(id + "state");
    const state: SimFixture["state"] = i % 4 === 0 ? "LIVE" : i % 4 === 3 ? "FINISHED" : "UPCOMING";
    const minute = state === "LIVE" ? 8 + Math.floor(r() * 78) : state === "FINISHED" ? 90 : null;
    const sh = state === "UPCOMING" ? null : Math.floor(r() * 4);
    const sa = state === "UPCOMING" ? null : Math.floor(r() * 3);
    return {
      id, sport, league: t[2], leagueLogo: "", home: t[0], away: t[1], homeLogo: "", awayLogo: "",
      kickoff: new Date(base + (i - 2) * 4500000).toISOString(), state, minute, scoreHome: sh, scoreAway: sa,
      markets: buildMarkets(id, sport, t[0], t[1]), provider: "kahlatchybet Simulation Engine", updated: base, simulated: true,
    };
  });
  if (scope === "live") return out.filter(f => f.state === "LIVE");
  if (scope === "upcoming") return out.filter(f => f.state === "UPCOMING");
  if (scope === "finished") return out.filter(f => f.state === "FINISHED");
  return out;
}

export function simFixtureById(id: string): SimFixture | null {
  const m = /^sim-([a-z]+)-(\d+)$/.exec(id);
  if (!m) return null;
  return simFixtures(m[1], "all").find(f => f.id === id) ?? null;
}

const NAMES = ["Karim", "Yassine", "Amine", "Sofien", "Mehdi", "Nour", "Rami", "Aziz", "Bilel", "Hamza", "Wassim", "Firas", "Skander", "Adem", "Zied"];
const GAMES = ["Golden Reels", "Neon Cascade", "Sky Rush", "Lucky Vault", "Crystal Storm", "Mega Bazaar", "Vortex Spin", "Diamond Bay"];
export function winnersFeed(n = 18) {
  const r = rng("winners-" + Math.floor(Date.now() / 45000));
  return Array.from({ length: n }).map((_, i) => ({
    id: i,
    user: NAMES[Math.floor(r() * NAMES.length)] + "***" + Math.floor(r() * 90 + 10),
    game: GAMES[Math.floor(r() * GAMES.length)],
    mult: Math.round((1.4 + r() * 60) * 100) / 100,
    amount: Math.round((120 + r() * 48000) * 100) / 100,
  }));
}