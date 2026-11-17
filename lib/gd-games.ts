import { db, nid, now } from "./db";

export const GD_REFERRER = "https://kahletchybet-msxo.vercel.app";
const BASE = "https://html5.gamedistribution.com/";
const IDS = [
  "a261dc8c8db44399a9da4ee98a285907",
  "2f140d7d57f748059c22c415053a33c5",
  "ee9758da2f734a13af3781fbd42c3558",
  "f8cd62870fbf451394a6093b9fa69553",
  "bb2a8674b78f47c7a4857aaad3fe6b9d",
  "341a9922b5814ab696ae8e86c8d826da",
  "6117e3b1665d4bfca6bc3ee51f461a99",
  "88adef5e4b2b4776ac9f6264d3055065",
  "ec1955b8909843d3858d6f4b2aec9afc",
  "e74a2983137342ab862cb20fb8e71446",
  "713f0709e7574123a6f50d9cd4213949",
  "47f4cfc8491a43b09b31879d249ec6ed",
];
const TITLES = [
  "Golden Reels", "Neon Cascade", "Sky Rush", "Lucky Vault", "Crystal Storm", "Mega Bazaar",
  "Vortex Spin", "Diamond Bay", "Royal Fortune", "Thunder Vault", "Emerald Rush", "Sunset Jackpot",
];
const CATS = ["slots", "slots", "crash", "slots", "instant", "slots", "crash", "instant", "table", "slots", "instant", "slots"];

export function gdUrl(id: string, referrer?: string) {
  const ref = (referrer && /^https?:\/\//i.test(referrer)) ? referrer.replace(/\/$/, "") : GD_REFERRER;
  return `${BASE}${id}/?gd_sdk_referrer_url=${encodeURIComponent(ref)}`;
}

let done = false;
export async function ensureGDGames() {
  if (done) return;
  done = true;
  const existing = await db.games();
  for (let i = 0; i < IDS.length; i++) {
    const gid = IDS[i];
    const found = existing.find(g => g.external_id === gid);
    if (found) {
      if (found.status !== "connected" || !found.launch_url) {
        await db.saveGame({ ...found, launch_url: gdUrl(gid), status: "connected", domains: "html5.gamedistribution.com,gamedistribution.com" });
      }
      continue;
    }
    await db.saveGame({
      id: nid(), name: TITLES[i], provider: "GameDistribution", category: CATS[i],
      external_id: gid, launch_url: gdUrl(gid), thumbnail: "", status: "connected",
      domains: "html5.gamedistribution.com,gamedistribution.com",
      config: JSON.stringify({ gd_sdk_referrer_url: GD_REFERRER }),
      featured: i < 6, sort: i, created: now(),
    });
  }
}