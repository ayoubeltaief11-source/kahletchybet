"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOdds = calculateOdds;
exports.evaluateBet = evaluateBet;
function poissonProb(lambda, k) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}
function factorial(n) {
    if (n === 0 || n === 1)
        return 1;
    let res = 1;
    for (let i = 2; i <= n; i++)
        res *= i;
    return res;
}
function calculateOdds(lamH, lamA) {
    let p1 = 0, pX = 0, p2 = 0;
    const maxGoals = 10;
    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            const prob = poissonProb(lamH, h) * poissonProb(lamA, a);
            if (h > a)
                p1 += prob;
            else if (h === a)
                pX += prob;
            else
                p2 += prob;
        }
    }
    const margin1X2 = 1.06;
    const price1 = +(1 / (p1 * margin1X2)).toFixed(2);
    const priceX = +(1 / (pX * margin1X2)).toFixed(2);
    const price2 = +(1 / (p2 * margin1X2)).toFixed(2);
    const lines = [
        { id: "1x2_1", market: "1X2", selection: "1", price: price1 },
        { id: "1x2_x", market: "1X2", selection: "X", price: priceX },
        { id: "1x2_2", market: "1X2", selection: "2", price: price2 },
    ];
    // Simplified O/U 2.5 for demo
    let pOver25 = 0;
    for (let h = 0; h <= maxGoals; h++)
        for (let a = 0; a <= maxGoals; a++)
            if (h + a > 2)
                pOver25 += poissonProb(lamH, h) * poissonProb(lamA, a);
    const marginOther = 1.07;
    lines.push({ id: "ou_o25", market: "OU", selection: "Over 2.5", price: +(1 / (pOver25 * marginOther)).toFixed(2) }, { id: "ou_u25", market: "OU", selection: "Under 2.5", price: +(1 / ((1 - pOver25) * marginOther)).toFixed(2) }, { id: "btts_y", market: "BTTS", selection: "Yes", price: 1.90 }, // Simplified
    { id: "btts_n", market: "BTTS", selection: "No", price: 1.90 });
    return { p1, pX, p2, lines };
}
function evaluateBet(bet, results) {
    let won = true;
    let voidCount = 0;
    let totalOdds = 1;
    for (const sel of bet.selections) {
        const res = results[sel.matchId];
        if (!res) {
            voidCount++;
            continue;
        } // Match not played yet
        const h = res.homeGoals, a = res.awayGoals;
        let selWon = false;
        let selVoid = false;
        if (sel.market === "1X2") {
            if (sel.selection === "1" && h > a)
                selWon = true;
            else if (sel.selection === "X" && h === a)
                selWon = true;
            else if (sel.selection === "2" && h < a)
                selWon = true;
        }
        else if (sel.market === "OU") {
            if (sel.selection.includes("Over") && (h + a) > 2.5)
                selWon = true;
            else if (sel.selection.includes("Under") && (h + a) < 2.5)
                selWon = true;
        }
        else if (sel.market === "BTTS") {
            if (sel.selection === "Yes" && h > 0 && a > 0)
                selWon = true;
            else if (sel.selection === "No" && (h === 0 || a === 0))
                selWon = true;
        }
        if (selVoid)
            voidCount++;
        else if (!selWon)
            won = false;
        else
            totalOdds *= sel.price;
    }
    if (voidCount === bet.selections.length)
        bet.status = "VOID";
    else if (!won)
        bet.status = "LOST";
    else if (voidCount > 0)
        bet.status = "WON"; // Partial win logic simplified
    bet.payout = won ? +(bet.stake * totalOdds).toFixed(2) : (bet.status === "VOID" ? bet.stake : 0);
    return bet;
}
