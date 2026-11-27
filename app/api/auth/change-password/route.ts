import { z } from "zod";
import { db, hashPassword, verifyPassword } from "@/lib/db";
import { needUser, bad, ok, logErr } from "@/lib/guard";

export const dynamic = "force-dynamic";

const Body = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const g = await needUser(); if (g.res) return g.res;
  try {
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad("بيانات غير صالحة");
    const { oldPassword, newPassword } = p.data;
    const user = await db.userById(g.user!.id);
    if (!user) return bad("المستخدم غير موجود", 404);
    if (!verifyPassword(oldPassword, user.password)) {
      return bad("كلمة المرور القديمة غير صحيحة", 401);
    }
    const hashed = hashPassword(newPassword);
    await db.patchUser(user.id, { password: hashed } as any);
    return ok({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (e) {
    logErr("change-password", e);
    return bad("فشل تغيير كلمة المرور", 500);
  }
}
