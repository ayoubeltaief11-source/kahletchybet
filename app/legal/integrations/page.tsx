export default function Integrations() {
  const rows = [
    ["API-Football", "FOOTBALL_ODDS_API_KEY", "Fixtures, live scores, match odds", "Free tier: 100 requests/day", "https://dashboard.api-football.com/", "https://www.api-football.com/documentation-v3"],
    ["The Odds API", "ODDS_API_KEY", "Bookmaker prices for basketball, tennis, baseball, hockey, MMA, esports", "Free tier: 500 requests/month", "https://the-odds-api.com/#get-access", "https://the-odds-api.com/liveapi/guides/v4/"],
    ["PostgreSQL (Neon)", "POSTGRES_URL", "Production database for accounts, ledger, bets and catalogue", "Free tier, no card required", "https://neon.tech", "https://neon.tech/docs"],
    ["Casino aggregator", "CASINO_AGGREGATOR_KEY", "Licensed game launch URLs and thumbnails", "Commercial agreement required", "https://gamedistribution.com", "https://docs.hub88.io/"],
  ];
  return (
    <div className="card pad col" style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1 className="h2">Integration guide</h1>
      <div className="note g">Every secret is a server-side environment variable. Copy <code>.env.example</code> to <code>.env.local</code> locally, or add the same variables in your hosting dashboard for production.</div>
      <div className="scroll">
        <table className="tbl">
          <thead><tr><th>Service</th><th>Variable</th><th>Purpose</th><th>Cost</th><th>Register</th><th>Docs</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r[0]}>
              <td><b className="xs">{r[0]}</b></td><td className="mono xxs">{r[1]}</td>
              <td className="xs dim">{r[2]}</td><td className="xs">{r[3]}</td>
              <td className="xs"><a href={r[4]} target="_blank" rel="noreferrer" style={{ color: "var(--gold-hi)" }}>Register</a></td>
              <td className="xs"><a href={r[5]} target="_blank" rel="noreferrer" style={{ color: "var(--jade)" }}>Docs</a></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h3 className="h3">Security notice</h3>
      <p className="xs dim">A key was previously shared in plain text during setup. Treat it as compromised: revoke it in the provider dashboard, generate a replacement, and store the new value only in environment variables.</p>
      <h3 className="h3">Adding a casino game</h3>
      <ol className="xs dim" style={{ lineHeight: 2.1, paddingInlineStart: 22 }}>
        <li>Obtain the launch URL, game ID, thumbnail URL and allowed domains from your licensed provider.</li>
        <li>Sign in as administrator and open <b>Admin â†’ Game integrations â†’ Add game</b>.</li>
        <li>Paste the values, set status to <b>connected</b>, and save. The title activates immediately in the lobby.</li>
        <li>The launch route validates the HTTPS URL and the allowed-domain list before opening the provider session in demo mode.</li>
      </ol>
    </div>
  );
}