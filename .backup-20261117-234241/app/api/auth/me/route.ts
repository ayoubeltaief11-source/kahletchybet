import { currentUser, publicUser } from "@/lib/auth";
import { ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await currentUser();
  return ok({ user: u ? publicUser(u) : null });
}