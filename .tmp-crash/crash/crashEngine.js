"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEngine = getEngine;
exports.stateAt = stateAt;
exports.cleanupEngine = cleanupEngine;
const registry_1 = require("../registry");
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h = (h ^ s.charCodeAt(i)) | 0;
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function crashAtFromR(r, rtp) {
    if (r < 0.001)
        return 1;
    const v = Math.floor(100 * rtp / (1 - r)) / 100;
    return Math.max(1, v);
}
const engines = new Map();
function getEngine(gameId) {
    let e = engines.get(gameId);
    if (!e) {
        const g = (0, registry_1.getGame)(gameId);
        const rtp = 0.95 + Math.random() * 0.02;
        const seed = hashStr(gameId);
        const rng = mulberry32(seed);
        const history = [];
        for (let i = 0; i < 15; i++)
            history.push(crashAtFromR(rng(), rtp));
        e = { round: 1, seed: seed, rtp: rtp, history: history };
        engines.set(gameId, e);
    }
    return e;
}
const BET_MS = 5000;
const FLY_MS = 12000;
const CRASHED_MS = 4000;
function stateAt(gameId, now) {
    const e = getEngine(gameId);
    const cycleMs = BET_MS + FLY_MS + CRASHED_MS;
    const inCycle = now % cycleMs;
    const round = Math.floor(now / cycleMs);
    const rng = mulberry32(e.seed + round * 7919);
    const crashAt = crashAtFromR(rng(), e.rtp);
    let phase = "betting";
    let mult = 1;
    let progress = 0;
    let betLeft = Math.max(0, BET_MS - inCycle);
    if (inCycle < BET_MS) {
        phase = "betting";
        mult = 1;
        progress = 0;
    }
    else if (inCycle < BET_MS + FLY_MS) {
        phase = "flying";
        const t = (inCycle - BET_MS) / FLY_MS;
        mult = Math.pow(crashAt, t * t);
        if (mult > crashAt)
            mult = crashAt;
        progress = t;
    }
    else {
        phase = "crashed";
        mult = crashAt;
        progress = 1;
        betLeft = cycleMs - inCycle;
    }
    if (round !== e.round) {
        e.history.unshift(crashAt);
        if (e.history.length > 30)
            e.history.length = 30;
        e.round = round;
    }
    return { phase: phase, mult: mult, crashAt: crashAt, progress: progress, betLeft: betLeft, index: round };
}
function cleanupEngine(gameId) {
    engines.delete(gameId);
}
