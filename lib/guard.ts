import { NextResponse } from "next/server";
import { currentUser } from "./auth";

export async function needUser() {
  const u = await currentUser();
  if (!u) return { user: null, res: NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 }) };
  return { user: u, res: null };
}
export async function needAdmin() {
  const u = await currentUser();
  if (!u) return { user: null, res: NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 }) };
  if (u.role !== "admin") return { user: null, res: NextResponse.json({ ok: false, error: "Administrator role required" }, { status: 403 }) };
  return { user: u, res: null };
}
export function bad(msg: string, code = 400) { return NextResponse.json({ ok: false, error: msg }, { status: code }); }
export function ok(data: unknown) { return NextResponse.json({ ok: true, ...(data as object) }); }
export function logErr(scope: string, e: unknown) { console.error(`[vortex:${scope}]`, e instanceof Error ? e.message : e); }