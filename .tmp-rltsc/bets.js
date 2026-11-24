"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBetState = createBetState;
exports.totalStake = totalStake;
exports.addPlacement = addPlacement;
exports.undo = undo;
exports.clearBets = clearBets;
exports.doubleBets = doubleBets;
exports.rebet = rebet;
exports.confirmBets = confirmBets;
exports.toBets = toBets;
exports.amountOn = amountOn;
const engine_1 = require("./engine");
function createBetState() {
    return { placements: [], history: [], last: [], nextId: 1 };
}
function totalStake(s) {
    let t = 0;
    for (const p of s.placements)
        t += p.amount;
    return Math.round(t * 100) / 100;
}
function pushHistory(s) {
    const h = s.history.concat([s.placements]);
    return h.length > 60 ? h.slice(h.length - 60) : h;
}
function addPlacement(v, s, type, numbers, chip) {
    const valid = (0, engine_1.makeBet)(v, type, numbers, chip);
    const key = type + ":" + (0, engine_1.betKey)(valid.numbers);
    const idx = s.placements.findIndex(function (p) { return p.key === key; });
    let placements;
    if (idx >= 0) {
        placements = s.placements.slice();
        placements[idx] = { ...placements[idx], amount: Math.round((placements[idx].amount + chip) * 100) / 100 };
    }
    else {
        placements = s.placements.concat([{ id: s.nextId, type: type, numbers: valid.numbers, amount: chip, key: key }]);
    }
    return { placements: placements, history: pushHistory(s), last: s.last, nextId: s.nextId + 1 };
}
function undo(s) {
    if (s.history.length === 0)
        return s;
    return { placements: s.history[s.history.length - 1], history: s.history.slice(0, -1), last: s.last, nextId: s.nextId };
}
function clearBets(s) {
    if (s.placements.length === 0)
        return s;
    return { placements: [], history: pushHistory(s), last: s.last, nextId: s.nextId };
}
function doubleBets(s) {
    if (s.placements.length === 0)
        return s;
    return { placements: s.placements.map(function (p) { return { ...p, amount: p.amount * 2 }; }), history: pushHistory(s), last: s.last, nextId: s.nextId };
}
function rebet(s) {
    if (s.last.length === 0)
        return s;
    return { placements: s.last.map(function (p) { return { ...p }; }), history: pushHistory(s), last: s.last, nextId: s.nextId };
}
function confirmBets(s) {
    return { placements: [], history: [], last: s.placements.map(function (p) { return { ...p }; }), nextId: s.nextId };
}
function toBets(s) {
    return s.placements.map(function (p) { return { type: p.type, numbers: p.numbers, amount: p.amount }; });
}
function amountOn(s, type, numbers) {
    const key = type + ":" + (0, engine_1.betKey)(numbers);
    const p = s.placements.find(function (x) { return x.key === key; });
    return p ? p.amount : 0;
}
