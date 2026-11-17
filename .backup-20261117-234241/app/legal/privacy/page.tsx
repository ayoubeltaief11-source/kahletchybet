export default function Privacy() {
  return (
    <div className="card pad col" style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 className="h2">Privacy Policy</h1>
      <h3 className="h3">Data we store</h3>
      <p className="xs dim">Account name, email, a scrypt password hash, virtual balance, bet records and a transaction ledger. Data is stored in the configured database (PostgreSQL in production, a local file during development).</p>
      <h3 className="h3">Data we never collect</h3>
      <p className="xs dim">No payment details, no identity documents, no location tracking, no advertising identifiers, no third-party analytics.</p>
      <h3 className="h3">Cookies</h3>
      <p className="xs dim">A single httpOnly session cookie keeps you signed in. It contains a random token; the server stores only its SHA-256 hash. Language preference is stored in your browser.</p>
      <h3 className="h3">Server-side provider calls</h3>
      <p className="xs dim">Sports requests are made from the server. Provider keys never reach the browser. Only normalized fixture and price data is returned to the client.</p>
      <h3 className="h3">Your control</h3>
      <p className="xs dim">An administrator can suspend or remove an account from the console. Passwords are never stored in plain text and cannot be recovered.</p>
    </div>
  );
}