export const SPORTS = [
  { key: "football", en: "Football", ar: "ÙƒØ±Ø© Ø§Ù„Ù‚Ø¯Ù…", fr: "Football", icon: "football", hue: "#12D18E" },
  { key: "basketball", en: "Basketball", ar: "ÙƒØ±Ø© Ø§Ù„Ø³Ù„Ø©", fr: "Basket", icon: "basketball", hue: "#F97316" },
  { key: "tennis", en: "Tennis", ar: "Ø§Ù„ØªÙ†Ø³", fr: "Tennis", icon: "tennis", hue: "#D9F24A" },
  { key: "volleyball", en: "Volleyball", ar: "Ø§Ù„ÙƒØ±Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø©", fr: "Volley", icon: "volleyball", hue: "#3B82F6" },
  { key: "baseball", en: "Baseball", ar: "Ø§Ù„Ø¨ÙŠØ³Ø¨ÙˆÙ„", fr: "Baseball", icon: "baseball", hue: "#EF4444" },
  { key: "hockey", en: "Hockey", ar: "Ø§Ù„Ù‡ÙˆÙƒÙŠ", fr: "Hockey", icon: "hockey", hue: "#22D3EE" },
  { key: "mma", en: "MMA", ar: "ÙÙ†ÙˆÙ† Ù‚ØªØ§Ù„ÙŠØ©", fr: "MMA", icon: "mma", hue: "#A855F7" },
  { key: "esports", en: "Esports", ar: "Ø±ÙŠØ§Ø¶Ø§Øª Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©", fr: "Esport", icon: "esports", hue: "#EC4899" },
] as const;

export const CASINO_CATEGORIES = [
  { key: "live", en: "Live Casino", ar: "ÙƒØ§Ø²ÙŠÙ†Ùˆ Ù…Ø¨Ø§Ø´Ø±", fr: "Casino Live", hue: "#E8B33C", glyph: "live" },
  { key: "slots", en: "Slots", ar: "Ø³Ù„ÙˆØªØ³", fr: "Machines", hue: "#A855F7", glyph: "slots" },
  { key: "crash", en: "Crash Games", ar: "Ø£Ù„Ø¹Ø§Ø¨ ÙƒØ±Ø§Ø´", fr: "Crash", hue: "#FF4757", glyph: "crash" },
  { key: "roulette", en: "Roulette", ar: "Ø±ÙˆÙ„ÙŠØª", fr: "Roulette", hue: "#12D18E", glyph: "roulette" },
  { key: "blackjack", en: "Blackjack", ar: "Ø¨Ù„Ø§Ùƒ Ø¬Ø§Ùƒ", fr: "Blackjack", hue: "#3B82F6", glyph: "blackjack" },
  { key: "table", en: "Table Games", ar: "Ø£Ù„Ø¹Ø§Ø¨ Ø§Ù„Ø·Ø§ÙˆÙ„Ø©", fr: "Jeux de table", hue: "#22D3EE", glyph: "table" },
  { key: "instant", en: "Instant Games", ar: "Ø£Ù„Ø¹Ø§Ø¨ ÙÙˆØ±ÙŠØ©", fr: "Jeux instantanÃ©s", hue: "#F97316", glyph: "instant" },
] as const;

export type Lang = "en" | "ar" | "fr";
const T: Record<string, Record<Lang, string>> = {
  sports: { en: "Sports", ar: "Ø§Ù„Ø±ÙŠØ§Ø¶Ø©", fr: "Sports" },
  casino: { en: "Casino", ar: "Ø§Ù„ÙƒØ§Ø²ÙŠÙ†Ùˆ", fr: "Casino" },
  live: { en: "Live", ar: "Ù…Ø¨Ø§Ø´Ø±", fr: "Direct" },
  wallet: { en: "Wallet", ar: "Ø§Ù„Ù…Ø­ÙØ¸Ø©", fr: "Portefeuille" },
  dashboard: { en: "Dashboard", ar: "Ù„ÙˆØ­ØªÙŠ", fr: "Tableau" },
  admin: { en: "Admin", ar: "Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©", fr: "Admin" },
  signin: { en: "Sign in", ar: "Ø¯Ø®ÙˆÙ„", fr: "Connexion" },
  register: { en: "Register", ar: "ØªØ³Ø¬ÙŠÙ„", fr: "Inscription" },
  signout: { en: "Sign out", ar: "Ø®Ø±ÙˆØ¬", fr: "DÃ©connexion" },
  balance: { en: "Balance", ar: "Ø§Ù„Ø±ØµÙŠØ¯", fr: "Solde" },
  slip: { en: "Bet Slip", ar: "Ù‚Ø³ÙŠÙ…Ø© Ø§Ù„Ø±Ù‡Ø§Ù†", fr: "Coupon" },
  stake: { en: "Stake", ar: "Ù…Ø¨Ù„Øº Ø§Ù„Ø±Ù‡Ø§Ù†", fr: "Mise" },
  place: { en: "Place demo bet", ar: "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±Ù‡Ø§Ù† Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠ", fr: "Pari dÃ©mo" },
  upcoming: { en: "Upcoming", ar: "Ù‚Ø§Ø¯Ù…Ø©", fr: "Ã€ venir" },
  finished: { en: "Finished", ar: "Ù…Ù†ØªÙ‡ÙŠØ©", fr: "TerminÃ©s" },
  all: { en: "All", ar: "Ø§Ù„ÙƒÙ„", fr: "Tous" },
  demo: { en: "Educational demo â€” virtual credits only. No real money.", ar: "Ù…Ù†ØµØ© ØªØ¹Ù„ÙŠÙ…ÙŠØ© ØªØ¬Ø±ÙŠØ¨ÙŠØ© â€” Ø£Ø±ØµØ¯Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ© ÙÙ‚Ø·ØŒ Ù„Ø§ Ø£Ù…ÙˆØ§Ù„ Ø­Ù‚ÙŠÙ‚ÙŠØ©.", fr: "DÃ©mo Ã©ducative â€” crÃ©dits virtuels uniquement." },
};
export const tr = (l: Lang, k: keyof typeof T) => T[k]?.[l] ?? String(k);
export const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " CR";