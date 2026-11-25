"use client";
import React from "react";
export default class Boundary extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  constructor(p: { children: React.ReactNode }) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e: unknown) { return { err: e instanceof Error ? e.message : String(e) }; }
  render() {
    if (this.state.err) return (
      <div style={{ minHeight: 400, display: "grid", placeItems: "center", color: "#ff5a5a", fontFamily: "monospace", padding: 24, textAlign: "center" }}>
        <div>
          <b>ATLAS RUNTIME ERROR</b>
          <p style={{ maxWidth: 600, wordBreak: "break-word" }}>{this.state.err}</p>
        </div>
      </div>
    );
    return this.props.children;
  }
}
