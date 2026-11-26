"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAGUES = void 0;
exports.getTeamBadgeSvg = getTeamBadgeSvg;
const TEAM_NAMES = {
    solar: ["Nova Kestrel", "Port Meridian", "Ironvale United", "Sable Harbor", "Zenith FC", "Aero City", "Crimson Tide", "Lunar Rovers", "Orbit United", "Stellar FC", "Comet Wanderers", "Nebula City", "Pulsar Athletic", "Quasar Rangers", "Meteor FC", "Galaxy United"],
    atlas: ["Summit Rangers", "Canyon FC", "Dune Athletic", "Oasis United", "Peak Wanderers", "Valley Rovers", "Cliffside City", "Ridge FC", "Apex United", "Horizon Athletic", "Vista Rangers", "Crest FC", "Pinnacle City", "Summit United", "Basecamp FC", "Altitude Rangers", "Zenith Athletic", "Meridian FC"],
    nordic: ["Fjord United", "Aurora FC", "Glacier Rangers", "Viking Athletic", "Tundra City", "Nordic Star", "Iceberg FC", "Boreal United", "Polar Rovers", "Snowfall FC", "Frost Athletic", "Rune City", "Saga United", "Valkyrie FC", "Odin Rangers", "Thor Athletic", "Loki City", "Freya United", "Baldur FC", "Heimdal Rangers"],
    azure: ["Coastal United", "Marina FC", "Coral Athletic", "Tide Rangers", "Harbor City", "Wave FC", "Lagoon United", "Reef Athletic", "Pelican FC", "Anchor City", "Sailor United", "Compass FC", "Knot Athletic", "Seagull Rangers", "Lighthouse FC", "Dockyard United", "Buoy Athletic", "Wharf FC", "Pier City", "Portside United"],
    ember: ["Flame United", "Ash FC", "Cinder Athletic", "Spark Rangers", "Volcano City", "Magma FC", "Inferno United", "Smoke Athletic", "Blaze FC", "Ember Rangers", "Coal City", "Furnace United", "Hearth FC", "Torch Athletic", "Pyre Rangers", "Cinderella FC", "Soot United", "Ignite Athletic", "Flare City", "Glow FC", "Radiant United", "Heat Rangers", "Scorch FC", "Brimstone City", "Lava United", "Ashen FC"],
    verde: ["Forest United", "Jungle FC", "Canopy Athletic", "Meadow Rangers", "Grove City", "Vine FC", "Fern United", "Moss Athletic", "Leaf FC", "Timber Rangers", "Root City", "Branch United", "Blossom FC", "Petal Athletic", "Seed Rangers", "Flora United", "Fauna FC", "Eden Athletic", "Wild City", "Nature United", "Greenwood FC", "Oasis Athletic", "Palm Rangers", "Bamboo City", "Cedar United", "Willow FC", "Oak Athletic", "Pine Rangers", "Maple City", "Elm United"]
};
const COLORS = ["#e63946", "#f4a261", "#2a9d8f", "#264653", "#e9c46a", "#8ab17d", "#606c38", "#283618", "#dda15e", "#bc6c25", "#6d6875", "#b5838d", "#6d597a", "#355070", "#eaac8b", "#b56576", "#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6", "#cb997e", "#ddbea9", "#a2d2ff", "#cdb4db"];
const SHAPES = ["M50,5 L95,25 L95,75 L50,95 L5,75 L5,25 Z", "M50,5 L95,50 L50,95 L5,50 Z", "M50,5 A45,45 0 1,1 49.9,5 Z", "M25,5 L75,5 L95,50 L50,95 L5,50 Z"];
const SYMBOLS = ["★", "✦", "♛", "⚔", "⚓", "☾", "☀", "✧", "⌛", "◉", "♜", "⚜"];
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
}
function getTeamBadgeSvg(teamName) {
    const h = hashStr(teamName);
    const shape = SHAPES[h % SHAPES.length];
    const c1 = COLORS[(h >> 4) % COLORS.length];
    const c2 = COLORS[(h >> 8) % COLORS.length];
    const sym = SYMBOLS[(h >> 12) % SYMBOLS.length];
    const initials = teamName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org2000/svg"><path d="${shape}" fill="${c1}" stroke="${c2}" stroke-width="4"/><text x="50" y="45" font-size="28" font-weight="900" fill="#fff" text-anchor="middle" font-family="system-ui">${initials}</text><text x="50" y="75" font-size="24" fill="${c2}" text-anchor="middle">${sym}</text></svg>`;
}
exports.LEAGUES = [
    { id: "solar", name: "Solar Premier", weeks: 18, offset: 0, teams: TEAM_NAMES.solar.slice(0, 16).map((n, i) => ({ id: `s_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) },
    { id: "atlas", name: "Atlas Cup League", weeks: 20, offset: 30000, teams: TEAM_NAMES.atlas.slice(0, 18).map((n, i) => ({ id: `a_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) },
    { id: "nordic", name: "Nordic Crown", weeks: 22, offset: 60000, teams: TEAM_NAMES.nordic.slice(0, 20).map((n, i) => ({ id: `n_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) },
    { id: "azure", name: "Azure Coast Liga", weeks: 24, offset: 90000, teams: TEAM_NAMES.azure.slice(0, 16).map((n, i) => ({ id: `az_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) },
    { id: "ember", name: "Ember Division", weeks: 26, offset: 120000, teams: TEAM_NAMES.ember.slice(0, 18).map((n, i) => ({ id: `e_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) },
    { id: "verde", name: "Verde Serie", weeks: 30, offset: 150000, teams: TEAM_NAMES.verde.slice(0, 20).map((n, i) => ({ id: `v_${i}`, name: n, attack: 0.9 + (i % 5) * 0.05, defense: 0.9 + ((4 - i) % 5) * 0.05, form: 0.8 + (i % 3) * 0.1 })) }
];
