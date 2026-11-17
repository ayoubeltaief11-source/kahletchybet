export default function Responsible() {
  return (
    <div className="card pad col" style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 className="h2">Responsible Play</h1>
      <div className="note g">This platform is a simulation. It never accepts or pays real money. Nothing here can be won or lost in financial terms.</div>
      <h3 className="h3">Why this page exists</h3>
      <p className="xs dim">Gambling products carry real risk of harm. This project reproduces interface patterns for study only and deliberately removes every financial mechanism.</p>
      <h3 className="h3">Healthy habits</h3>
      <ul className="xs dim" style={{ lineHeight: 2.1, paddingInlineStart: 22 }}>
        <li>Treat simulated outcomes as mathematics, never as a prediction of real betting success.</li>
        <li>Every commercial game carries a house edge  long-run expectation is negative by design.</li>
        <li>Take breaks and never chase losses, even with virtual credits.</li>
        <li>Do not move from a simulation to real-money gambling expecting the same experience.</li>
      </ul>
      <h3 className="h3">If gambling affects you or someone you know</h3>
      <p className="xs dim">Contact a local health service or a recognised gambling-support organisation in your country. In Tunisia, speak with a medical professional or public health service for referral.</p>
      <h3 className="h3">Age restriction</h3>
      <p className="xs dim">18+ only, including for simulation content.</p>
    </div>
  );
}