"use client";
import Link from "next/link";
import { useState } from "react";
import { useKbFonts } from "@/lib/kb/prefs";
import AudioBoot from "@/components/kb2/AudioBoot";

function Bar({ value, hue }: { value: number; hue: string }) {
  return (
    <div className="k8-bar">
      <i style={{ width: Math.max(0, Math.min(100, value)) + "%", background: hue }}/>
      <u style={{ left: "100%" }}/>
    </div>
  );
}

export default function Learn() {
  useKbFonts();
  const [bet, setBet] = useState(5);
  const [spins, setSpins] = useState(500);
  const [rtp, setRtp] = useState(96.5);
  const staked = bet * spins;
  const expected = staked * (rtp / 100);
  const loss = staked - expected;
  const edge = 100 - rtp;

  return (
    <div className="k8">
      <AudioBoot/>
      <div className="k8-top">
        <Link href="/casino" className="k8-back">Back to lobby</Link>
        <span className="k8-demo">DEMO - no real money</span>
        <h1>Learn the math</h1>
      </div>

      <div className="k8-lead">
        This platform is a simulator. The unit TD has no monetary value and cannot be bought, sold, deposited or withdrawn.
        Every game here shows its numbers openly, because understanding those numbers is the entire point.
      </div>

      <div className="k8-grid">
        <article className="k8-card">
          <span className="k8-num">01</span>
          <h2>RTP - Return To Player</h2>
          <p>RTP is the share of all staked value a game pays back over a very long run. An RTP of 96.5% means that for every 100 TD wagered across millions of rounds, about 96.50 TD returns to players and 3.50 TD stays with the house.</p>
          <p className="k8-key">RTP is a long-run average, never a promise for your session.</p>
          <Bar value={96.5} hue="linear-gradient(90deg,#12d18e,#e8b33c)"/>
          <div className="k8-legend"><span>96.5% returned</span><span>3.5% kept</span></div>
        </article>

        <article className="k8-card">
          <span className="k8-num">02</span>
          <h2>House edge</h2>
          <p>The house edge is simply 100% minus RTP. It is the built-in mathematical advantage. In our European roulette the single zero is the whole edge: a straight number pays 36x but there are 37 pockets, so the edge is 1/37 = 2.70%.</p>
          <p className="k8-key">No betting pattern, streak or system removes the edge.</p>
          <div className="k8-facts">
            <div><span>Crash</span><b>3.0%</b></div>
            <div><span>Slots</span><b>3.5%</b></div>
            <div><span>Roulette</span><b>2.7%</b></div>
            <div><span>Table</span><b>4.0%</b></div>
          </div>
        </article>

        <article className="k8-card">
          <span className="k8-num">03</span>
          <h2>Volatility</h2>
          <p>Volatility describes how the same RTP is delivered. Low volatility pays small amounts often. High volatility pays rarely but large. Two games can share an identical RTP and feel completely different.</p>
          <div className="k8-vol">
            <div><em>LOW</em><span>frequent small hits</span><div className="k8-spark">{[3,4,3,4,3,4,3,4].map(function (h, i) { return <i key={i} style={{ height: h * 6 + "px" }}/>; })}</div></div>
            <div><em>HIGH</em><span>rare large hits</span><div className="k8-spark">{[1,1,1,12,1,1,1,1].map(function (h, i) { return <i key={i} style={{ height: h * 6 + "px" }}/>; })}</div></div>
          </div>
          <p className="k8-key">High volatility means longer losing stretches, not better odds.</p>
        </article>

        <article className="k8-card">
          <span className="k8-num">04</span>
          <h2>Independence</h2>
          <p>Every round is drawn independently. A crash game that just busted at 1.02x is not due for a big flight. A roulette wheel that showed red eight times still has 18 red of 37 pockets on the next spin.</p>
          <p className="k8-key">Believing a result is due is the gambler's fallacy.</p>
          <div className="k8-facts">
            <div><span>Red next spin</span><b>48.6%</b></div>
            <div><span>After 8 reds</span><b>48.6%</b></div>
          </div>
        </article>
      </div>

      <section className="k8-calc">
        <h2>Long-run calculator</h2>
        <p>Move the sliders. This is the expected outcome, not a prediction of any single session.</p>
        <div className="k8-sliders">
          <label><span>Bet per round</span><input type="range" min={1} max={100} value={bet} onChange={function (e) { setBet(Number(e.target.value)); }}/><em>{bet} TD</em></label>
          <label><span>Rounds played</span><input type="range" min={50} max={5000} step={50} value={spins} onChange={function (e) { setSpins(Number(e.target.value)); }}/><em>{spins}</em></label>
          <label><span>Game RTP</span><input type="range" min={90} max={99} step={0.5} value={rtp} onChange={function (e) { setRtp(Number(e.target.value)); }}/><em>{rtp.toFixed(1)}%</em></label>
        </div>
        <div className="k8-out">
          <div><span>Total staked</span><b>{staked.toLocaleString("en-US")} TD</b></div>
          <div><span>Expected return</span><b className="k8-good">{expected.toLocaleString("en-US", { maximumFractionDigits: 0 })} TD</b></div>
          <div><span>Expected loss</span><b className="k8-bad">-{loss.toLocaleString("en-US", { maximumFractionDigits: 0 })} TD</b></div>
          <div><span>House edge</span><b>{edge.toFixed(1)}%</b></div>
        </div>
        <div className="k8-verdict">
          Over {spins.toLocaleString("en-US")} rounds at {bet} TD, the mathematics expects you to be down about {loss.toLocaleString("en-US", { maximumFractionDigits: 0 })} TD.
          The longer you play, the closer your result moves toward this number. That is why the house never needs luck.
        </div>
      </section>

      <section className="k8-rules">
        <h2>How this simulator stays honest</h2>
        <ul>
          <li>Every stake is debited once when a round opens, on the server.</li>
          <li>A payout is credited only on a win or a cashout, and each round is locked after settlement so nothing pays twice.</li>
          <li>In crash, a cashout above the actual crash point is rejected by the server.</li>
          <li>The RTP used for each round is read from the administrator setting and written into the round record.</li>
          <li>New accounts start at 0.00 TD. Only an administrator can add TD, and it is never purchasable.</li>
        </ul>
        <Link href="/casino" className="k8-cta">BACK TO THE LOBBY</Link>
      </section>
    </div>
  );
}