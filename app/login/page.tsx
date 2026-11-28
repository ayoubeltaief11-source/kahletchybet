"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      if (data.mustChangePassword) {
        const confirmChange = confirm("Your account was created by an administrator. It is recommended to change your temporary password now. Do you want to change it?");
        if (confirmChange) {
          router.push("/change-password");
          return;
        }
      }
      router.push("/dashboard");
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
      <h1 className="h2" style={{ marginBottom: 24 }}>Sign In</h1>
      {error && <div style={{ color: "#f87171", marginBottom: 16, padding: 8, background: "rgba(255,71,87,.1)", borderRadius: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="k2-btn"
          style={{ padding: "12px 16px" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="k2-btn"
          style={{ padding: "12px 16px" }}
          required
        />
        <button type="submit" className="k2-btn k2-btn-gold" style={{ padding: "12px 24px" }} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: "var(--k2-dim)" }}>
        Don't have an account? <Link href="/register" style={{ color: "var(--k2-gold2)" }}>Register</Link>
      </div>
    </div>
  );
}
