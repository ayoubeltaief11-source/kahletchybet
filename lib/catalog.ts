export const BRAND = "kahlatchybet";

export const SPORTS = [
  { key: "football", en: "Football", ar: "\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645", fr: "Football", icon: "football", hue: "#12D18E" },
  { key: "basketball", en: "Basketball", ar: "\u0643\u0631\u0629 \u0627\u0644\u0633\u0644\u0629", fr: "Basket", icon: "basketball", hue: "#F97316" },
  { key: "tennis", en: "Tennis", ar: "\u0627\u0644\u062a\u0646\u0633", fr: "Tennis", icon: "tennis", hue: "#D9F24A" },
  { key: "volleyball", en: "Volleyball", ar: "\u0627\u0644\u0643\u0631\u0629 \u0627\u0644\u0637\u0627\u0626\u0631\u0629", fr: "Volley", icon: "volleyball", hue: "#3B82F6" },
  { key: "baseball", en: "Baseball", ar: "\u0627\u0644\u0628\u064a\u0633\u0628\u0648\u0644", fr: "Baseball", icon: "baseball", hue: "#EF4444" },
  { key: "hockey", en: "Hockey", ar: "\u0627\u0644\u0647\u0648\u0643\u064a", fr: "Hockey", icon: "hockey", hue: "#22D3EE" },
  { key: "mma", en: "MMA", ar: "\u0641\u0646\u0648\u0646 \u0642\u062a\u0627\u0644\u064a\u0629", fr: "MMA", icon: "mma", hue: "#A855F7" },
  { key: "esports", en: "Esports", ar: "\u0631\u064a\u0627\u0636\u0627\u062a \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629", fr: "Esport", icon: "esports", hue: "#EC4899" },
] as const;

export const CASINO_CATEGORIES = [
  { key: "live", en: "Live Casino", ar: "\u0643\u0627\u0632\u064a\u0646\u0648 \u0645\u0628\u0627\u0634\u0631", fr: "Casino Live", hue: "#E8B33C", glyph: "live" },
  { key: "slots", en: "Slots", ar: "\u0633\u0644\u0648\u062a\u0633", fr: "Machines", hue: "#A855F7", glyph: "slots" },
  { key: "crash", en: "Crash Games", ar: "\u0623\u0644\u0639\u0627\u0628 \u0643\u0631\u0627\u0634", fr: "Crash", hue: "#FF4757", glyph: "crash" },
  { key: "roulette", en: "Roulette", ar: "\u0631\u0648\u0644\u064a\u062a", fr: "Roulette", hue: "#12D18E", glyph: "roulette" },
  { key: "blackjack", en: "Blackjack", ar: "\u0628\u0644\u0627\u0643 \u062c\u0627\u0643", fr: "Blackjack", hue: "#3B82F6", glyph: "blackjack" },
  { key: "table", en: "Table Games", ar: "\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0637\u0627\u0648\u0644\u0629", fr: "Jeux de table", hue: "#22D3EE", glyph: "table" },
  { key: "instant", en: "Instant Games", ar: "\u0623\u0644\u0639\u0627\u0628 \u0641\u0648\u0631\u064a\u0629", fr: "Instant", hue: "#F97316", glyph: "instant" },
] as const;

export type Lang = "en" | "ar" | "fr";
const T: Record<string, Record<Lang, string>> = {
  home: { en: "Home", ar: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", fr: "Accueil" },
  sports: { en: "Sports", ar: "\u0627\u0644\u0631\u064a\u0627\u0636\u0629", fr: "Sports" },
  casino: { en: "Casino", ar: "\u0627\u0644\u0643\u0627\u0632\u064a\u0646\u0648", fr: "Casino" },
  live: { en: "Live", ar: "\u0645\u0628\u0627\u0634\u0631", fr: "Direct" },
  wallet: { en: "Wallet", ar: "\u0627\u0644\u0645\u062d\u0641\u0638\u0629", fr: "Portefeuille" },
  dashboard: { en: "Dashboard", ar: "\u0644\u0648\u062d\u062a\u064a", fr: "Tableau" },
  admin: { en: "Admin", ar: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629", fr: "Admin" },
  signin: { en: "Sign in", ar: "\u062f\u062e\u0648\u0644", fr: "Connexion" },
  register: { en: "Register", ar: "\u062a\u0633\u062c\u064a\u0644", fr: "Inscription" },
  signout: { en: "Sign out", ar: "\u062e\u0631\u0648\u062c", fr: "Deconnexion" },
  balance: { en: "Balance", ar: "\u0627\u0644\u0631\u0635\u064a\u062f", fr: "Solde" },
  slip: { en: "Bet Slip", ar: "\u0642\u0633\u064a\u0645\u0629 \u0627\u0644\u0631\u0647\u0627\u0646", fr: "Coupon" },
  stake: { en: "Stake", ar: "\u0645\u0628\u0644\u063a \u0627\u0644\u0631\u0647\u0627\u0646", fr: "Mise" },
  place: { en: "Place demo bet", ar: "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0631\u0647\u0627\u0646", fr: "Valider" },
  upcoming: { en: "Upcoming", ar: "\u0642\u0627\u062f\u0645\u0629", fr: "A venir" },
  finished: { en: "Finished", ar: "\u0645\u0646\u062a\u0647\u064a\u0629", fr: "Termines" },
  all: { en: "All", ar: "\u0627\u0644\u0643\u0644", fr: "Tous" },
  winners: { en: "Winners", ar: "\u0627\u0644\u0631\u0627\u0628\u062d\u0648\u0646", fr: "Gagnants" },
  markets: { en: "Markets", ar: "\u0627\u0644\u0623\u0633\u0648\u0627\u0642", fr: "Marches" },
  demo: {
    en: "Educational demo - virtual credits only. No real money.",
    ar: "\u0645\u0646\u0635\u0629 \u062a\u0639\u0644\u064a\u0645\u064a\u0629 - \u0623\u0631\u0635\u062f\u0629 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0641\u0642\u0637",
    fr: "Demo educative - credits virtuels uniquement.",
  },
};
export const tr = (l: Lang, k: keyof typeof T) => T[k]?.[l] ?? String(k);
export const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " CR";