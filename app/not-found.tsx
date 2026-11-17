import Link from "next/link";
export default function NotFound() {
  return (
    <div className="hero ctr" style={{ marginTop: 34 }}>
      <div style={{ fontSize: 76, fontWeight: 900, color: "var(--gold)", letterSpacing: -4 }}>404</div>
      <h1 className="h1" style={{ fontSize: 30 }}>This page is off the board</h1>
      <p className="lead" style={{ margin: "0 auto 22px" }}>The route you requested does not exist. Return to the lobby or open the sportsbook.</p>
      <div className="row" style={{ justifyContent: "center" }}><Link href="/" className="btn g"> Home</Link><Link href="/casino" className="btn o">Casino</Link><Link href="/sports" className="btn o">Sports</Link></div>
    </div>
  );
}