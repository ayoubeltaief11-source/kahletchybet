"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mulberry32 = mulberry32;
exports.getLeagueState = getLeagueState;
// Pitch Pulse: Pure state function based on epoch + offset + mulberry32
const leagues_1 = require("./leagues");
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const EPOCH = 1700000000000;
const WEEK_MS = 180000; // 90s BETTING + 75s LIVE + 15s RESULTS
const BREAK_MS = 300000; // 300s SEASON_BREAK
function getLeagueState(leagueId, now = Date.now()) {
    const league = leagues_1.LEAGUES.find(l => l.id === leagueId);
    if (!league)
        return null;
    const timeSinceEpoch = now - EPOCH;
    const adjustedTime = timeSinceEpoch + league.offset;
    const seasonLength = (league.weeks * WEEK_MS) + BREAK_MS;
    const timeInSeason = ((adjustedTime % seasonLength) + seasonLength) % seasonLength;
    let phase;
    let msRemaining = 0;
    let week = 0;
    let timeInWeek = 0;
    if (timeInSeason >= league.weeks * WEEK_MS) {
        phase = "SEASON_BREAK";
        msRemaining = seasonLength - timeInSeason;
        week = league.weeks;
    }
    else {
        week = Math.floor(timeInSeason / WEEK_MS) + 1;
        timeInWeek = timeInSeason % WEEK_MS;
        if (timeInWeek < 90000) {
            phase = "BETTING";
            msRemaining = 90000 - timeInWeek;
        }
        else if (timeInWeek < 165000) {
            phase = "LIVE";
            msRemaining = 165000 - timeInWeek;
        }
        else {
            phase = "RESULTS";
            msRemaining = 180000 - timeInWeek;
        }
    }
    const season = Math.floor(adjustedTime / seasonLength) + 1;
    const seed = hashStr(`${leagueId}_${season}_${week}`);
    const rng = mulberry32(seed);
    // Generate fixtures for this week (Round Robin simplified)
    const fixtures = [];
    const teams = [...league.teams].sort((a, b) => (hashStr(a.id + week) % 2 === 0 ? 1 : -1));
    for (let i = 0; i < teams.length; i += 2) {
        if (teams[i + 1]) {
            const homeAdv = 1.15;
            const lamH = 1.2 * (teams[i].attack / teams[i + 1].defense) * homeAdv;
            const lamA = 0.9 * (teams[i + 1].attack / teams[i].defense);
            const gH = poisson(lamH, rng);
            const gA = poisson(lamA, rng);
            const events = [];
            for (let g = 0; g < gH; g++)
                events.push({ min: Math.floor(rng() * 90) + 1, type: "goal", team: "home" });
            for (let g = 0; g < gA; g++)
                events.push({ min: Math.floor(rng() * 90) + 1, type: "goal", team: "away" });
            events.sort((a, b) => a.min - b.min);
            let minute = 0;
            if (phase === "LIVE")
                minute = Math.floor(((timeInWeek - 90000) / 75000) * 90);
            else if (phase === "RESULTS" || phase === "SEASON_BREAK")
                minute = 90;
            fixtures.push({ homeId: teams[i].id, awayId: teams[i + 1].id, homeGoals: gH, awayGoals: gA, minute, events });
        }
    }
    // Calculate standings up to this week
    const standings = {};
    league.teams.forEach(t => standings[t.id] = { p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 });
    for (let w = 1; w <= week; w++) {
        const wSeed = hashStr(`${leagueId}_${season}_${w}`);
        const wRng = mulberry32(wSeed);
        const wTeams = [...league.teams].sort((a, b) => (hashStr(a.id + w) % 2 === 0 ? 1 : -1));
        for (let i = 0; i < wTeams.length; i += 2) {
            if (wTeams[i + 1]) {
                const lamH = 1.2 * (wTeams[i].attack / wTeams[i + 1].defense) * 1.15;
                const lamA = 0.9 * (wTeams[i + 1].attack / wTeams[i].defense);
                const gH = poisson(lamH, wRng);
                const gA = poisson(lamA, wRng);
                standings[wTeams[i].id].p++;
                standings[wTeams[i + 1].id].p++;
                standings[wTeams[i].id].f += gH;
                standings[wTeams[i].id].a += gA;
                standings[wTeams[i + 1].id].f += gA;
                standings[wTeams[i + 1].id].a += gH;
                if (gH > gA) {
                    standings[wTeams[i].id].w++;
                    standings[wTeams[i].id].pts += 3;
                    standings[wTeams[i + 1].id].l++;
                }
                else if (gH < gA) {
                    standings[wTeams[i + 1].id].w++;
                    standings[wTeams[i + 1].id].pts += 3;
                    standings[wTeams[i].id].l++;
                }
                else {
                    standings[wTeams[i].id].d++;
                    standings[wTeams[i].id].pts += 1;
                    standings[wTeams[i + 1].id].d++;
                    standings[wTeams[i + 1].id].pts += 1;
                }
            }
        }
    }
    return { league, season, week, phase, msRemaining, fixtures, standings };
}
function poisson(lambda, rng) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do {
        k++;
        p *= rng();
    } while (p > L);
    return k - 1;
}
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
}
