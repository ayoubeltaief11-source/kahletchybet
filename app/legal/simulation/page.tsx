export default function SimulationPolicy() {
  return (
    <div className="card pad col" style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 className="h2">Simulation Transparency</h1>
      <div className="note g">kahlatchybet is an educational demonstration. The virtual currency TD has no monetary value and cannot be purchased, transferred, exchanged or redeemed.</div>
      <h3 className="h3">Server-generated outcomes</h3>
      <p className="xs dim">Every casino round is generated and settled on the server. The browser never decides results and never holds authority over balances.</p>
      <h3 className="h3">Configurable teaching parameters</h3>
      <p className="xs dim">Because this is a teaching environment, administrators can configure a weekly net-return ceiling per account. This shapes the sequence of simulated outcomes so an instructor can demonstrate variance, house edge and bankroll management within a bounded session. It has no financial effect of any kind.</p>
      <h3 className="h3">Audit trail</h3>
      <p className="xs dim">All administrative funding actions and parameter changes are recorded with actor, target, timestamp and detail, and are visible in the administrator console.</p>
      <h3 className="h3">Hard separation from real money</h3>
      <p className="xs dim">No payment provider, bank, card network or cryptocurrency service is connected. The outcome-shaping module is locked to simulation mode and must never be deployed alongside real-value transactions, which would require licensing and would make such shaping unlawful.</p>
      <h3 className="h3">Provider games</h3>
      <p className="xs dim">Titles served by GameDistribution run inside the provider session with provider credits. Their outcomes are controlled by the provider, not by this platform.</p>
    </div>
  );
}