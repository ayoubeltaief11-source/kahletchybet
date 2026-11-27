"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل تغيير كلمة المرور");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("خطأ في الشبكة");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
      <h1 className="h2" style={{ marginBottom: 24 }}>تغيير كلمة المرور</h1>
      {success ? (
        <div style={{ padding: 16, background: "#1a3a1a", borderRadius: 8, color: "#4ade80" }}>
          تم تغيير كلمة المرور بنجاح. سيتم تحويلك...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="كلمة المرور القديمة"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
          />
          {error && <div style={{ color: "#f87171", fontSize: 14 }}>{error}</div>}
          <button type="submit" className="btn">حفظ التغييرات</button>
        </form>
      )}
    </div>
  );
}
