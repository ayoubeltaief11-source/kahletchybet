import { z } from "zod";
import { db } from "@/lib/db";
import { needUser, bad, ok } from "@/lib/guard";
import { publicUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
const Body = z.object({ name: z.string().min(3).max(40).optional(), avatar: z.string().max(20).optional() });
export async function POST(req: Request) {
  const g = await needUser(); if (g.res) return g.res;
  const p = Body.safeParse(await req.json());
  if (!p.success) return bad("Invalid profile data");
  await db.patchUser(g.user!.id, p.data);
  return ok({ user: publicUser((await db.userById(g.user!.id))!) });
}