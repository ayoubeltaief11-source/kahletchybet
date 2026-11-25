"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MULT_WEIGHTS = exports.ANTE_WEIGHTS = exports.NORMAL_WEIGHTS = exports.PAYS = exports.MULT_VALUES = exports.MAX_WIN_X = exports.MIN_PAY = exports.ROWS = exports.COLS = void 0;
exports.mulberry32 = mulberry32;
exports.pickWeighted = pickWeighted;
exports.makeGrid = makeGrid;
exports.countSymbols = countSymbols;
exports.payFor = payFor;
exports.collectMultiplierBalls = collectMultiplierBalls;
exports.removeWins = removeWins;
exports.fillColumn = fillColumn;
exports.computeSpin = computeSpin;
exports.buyFeaturePrice = buyFeaturePrice;
exports.anteCost = anteCost;
exports.COLS = 6, exports.ROWS = 5, exports.MIN_PAY = 8, exports.MAX_WIN_X = 25000;
exports.MULT_VALUES = [2, 3, 5, 10, 25, 50, 100, 250, 500];
// Pay tables (per unit bet)
exports.PAYS = {
    s1: { 8: 0.15, 10: 0.4, 12: 0.8, 15: 1.5, 20: 4, 25: 8, 30: 20 },
    s2: { 8: 0.15, 10: 0.4, 12: 0.8, 15: 1.5, 20: 4, 25: 8, 30: 20 },
    s3: { 8: 0.15, 10: 0.4, 12: 0.8, 15: 1.5, 20: 4, 25: 8, 30: 20 },
    s4: { 8: 0.15, 10: 0.4, 12: 0.8, 15: 1.5, 20: 4, 25: 8, 30: 20 },
    s5: { 8: 0.4, 10: 0.8, 12: 1.5, 15: 4, 20: 8, 25: 20, 30: 40 },
    s6: { 8: 0.4, 10: 0.8, 12: 1.5, 15: 4, 20: 8, 25: 20, 30: 40 },
    s7: { 8: 0.8, 10: 1.5, 12: 4, 15: 8, 20: 20, 25: 40, 30: 80 },
    s8: { 8: 0.8, 10: 1.5, 12: 4, 15: 8, 20: 20, 25: 40, 30: 80 },
    s9: { 4: 2, 5: 10, 6: 50 }
};
// Weights per symbol on normal reels (sum ~1000)
exports.NORMAL_WEIGHTS = {
    s1: 135, s2: 125, s3: 115, s4: 105,
    s5: 80, s6: 65, s7: 45, s8: 30,
    s9: 15, mult: 8
};
// Ante bet: scatter weight x2.5
exports.ANTE_WEIGHTS = {
    s1: 135, s2: 125, s3: 115, s4: 105,
    s5: 80, s6: 65, s7: 45, s8: 30,
    s9: 35, mult: 8
};
// Multiplier ball weights
exports.MULT_WEIGHTS = {
    2: 450, 3: 300, 5: 180, 10: 60, 25: 15, 50: 5
};
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function pickWeighted(rng, weights) {
    let total = 0;
    for (const k in weights)
        total += weights[k];
    let r = rng() * total;
    for (const k in weights) {
        r -= weights[k];
        if (r <= 0)
            return k;
    }
    return Object.keys(weights)[Object.keys(weights).length - 1];
}
function makeGrid(rng, weights) {
    const grid = [];
    for (let c = 0; c < exports.COLS; c++) {
        const col = [];
        for (let r = 0; r < exports.ROWS; r++) {
            const s = pickWeighted(rng, weights);
            if (s === "mult") {
                const mv = Number(pickWeighted(rng, exports.MULT_WEIGHTS));
                col.push({ sym: "mult", mult: mv });
            }
            else {
                col.push({ sym: s });
            }
        }
        grid.push(col);
    }
    return grid;
}
function countSymbols(grid) {
    const counts = {};
    for (let c = 0; c < exports.COLS; c++) {
        for (let r = 0; r < exports.ROWS; r++) {
            const k = grid[c][r].sym;
            if (!counts[k])
                counts[k] = { count: 0, positions: [] };
            counts[k].count++;
            counts[k].positions.push([c, r]);
        }
    }
    return counts;
}
function payFor(sym, count) {
    const t = exports.PAYS[sym];
    if (!t)
        return 0;
    let best = 0;
    for (const k of Object.keys(t).map(Number).sort((a, b) => a - b)) {
        if (count >= k)
            best = t[k];
    }
    return best;
}
function collectMultiplierBalls(grid) {
    let sum = 0;
    const positions = [];
    for (let c = 0; c < exports.COLS; c++) {
        for (let r = 0; r < exports.ROWS; r++) {
            if (grid[c][r].sym === "mult" && grid[c][r].mult) {
                sum += grid[c][r].mult;
                positions.push([c, r]);
            }
        }
    }
    return { sum, positions };
}
function removeWins(grid, wins) {
    const removeSet = new Set();
    for (const w of wins)
        for (const [c, r] of w.positions)
            removeSet.add(c + "," + r);
    const newGrid = [];
    for (let c = 0; c < exports.COLS; c++) {
        const col = [];
        for (let r = 0; r < exports.ROWS; r++) {
            if (!removeSet.has(c + "," + r))
                col.push(grid[c][r]);
        }
        newGrid.push(col);
    }
    return newGrid;
}
function fillColumn(col, need, rng, weights) {
    const out = col.slice();
    while (out.length < exports.ROWS) {
        const s = pickWeighted(rng, weights);
        if (s === "mult") {
            const mv = Number(pickWeighted(rng, exports.MULT_WEIGHTS));
            out.unshift({ sym: "mult", mult: mv });
        }
        else {
            out.unshift({ sym: s });
        }
    }
    return out;
}
function computeSpin(seed, ante, freeSpins, accumulatedMult) {
    const rng = mulberry32(seed);
    const weights = ante ? exports.ANTE_WEIGHTS : exports.NORMAL_WEIGHTS;
    let grid = makeGrid(rng, weights);
    const cascadeWins = [];
    let totalWin = 0;
    let step = 0;
    let multSum = 0;
    let multPositions = [];
    let scatterCount = 0;
    let capped = false;
    while (step < 20) {
        const counts = countSymbols(grid);
        const wins = [];
        for (const sym of ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"]) {
            const info = counts[sym];
            if (info && info.count >= (sym === "s9" ? 4 : exports.MIN_PAY)) {
                const pay = payFor(sym, info.count);
                wins.push({ sym, count: info.count, pay, positions: info.positions });
            }
        }
        if (wins.length === 0)
            break;
        let stepWin = 0;
        for (const w of wins)
            stepWin += w.pay;
        if (counts["s9"])
            scatterCount += counts["s9"].count;
        const mb = collectMultiplierBalls(grid);
        if (step === 0) {
            multSum = mb.sum;
            multPositions = mb.positions;
        }
        else {
            multSum += mb.sum;
            multPositions = multPositions.concat(mb.positions);
        }
        cascadeWins.push(stepWin);
        totalWin += stepWin;
        if (totalWin > exports.MAX_WIN_X) {
            totalWin = exports.MAX_WIN_X;
            capped = true;
            break;
        }
        grid = removeWins(grid, wins);
        for (let c = 0; c < exports.COLS; c++) {
            grid[c] = fillColumn(grid[c], exports.ROWS - grid[c].length, rng, weights);
        }
        step++;
    }
    if (totalWin > 0 && multSum > 0) {
        const mult = freeSpins ? (accumulatedMult + multSum) : multSum;
        totalWin = totalWin * mult;
        if (totalWin > exports.MAX_WIN_X) {
            totalWin = exports.MAX_WIN_X;
            capped = true;
        }
    }
    return {
        grid, wins: [], multSum, multPositions, scatterCount,
        cascadeWins, totalWin, capped
    };
}
function buyFeaturePrice(bet) { return bet * 100; }
function anteCost(bet) { return Math.round(bet * 1.25 * 100) / 100; }
