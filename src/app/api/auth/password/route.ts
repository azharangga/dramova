import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sesi habis. Silakan login ulang." }, { status: 401 });

  const { currentPassword, newPassword } = await request.json().catch(() => ({ currentPassword: "", newPassword: "" }));
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: String(currentPassword || ""),
  });
  if (verifyError) return NextResponse.json({ error: "Password lama salah" }, { status: 400 });

  const { error } = await supabase.auth.updateUser({ password: String(newPassword || "") });
  if (error) return NextResponse.json({ error: "Password baru belum bisa disimpan. Coba gunakan password lain." }, { status: 400 });

  return NextResponse.json({ ok: true });
}
