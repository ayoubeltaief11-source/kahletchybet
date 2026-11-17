import { endSession } from "@/lib/auth";
import { ok } from "@/lib/guard";
export async function POST() { await endSession(); return ok({}); }