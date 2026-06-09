import { NextResponse } from "next/server";
import { mapAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi habis. Silakan login ulang." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : mapAuthUser(user)?.name || "Pengguna";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : user.email || "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : mapAuthUser(user)?.avatarUrl;
  const updateEmail = email && email !== user.email;

  const { data, error } = await supabase.auth.updateUser({
    ...(updateEmail ? { email } : {}),
    data: { name, avatar_url: avatarUrl },
  });
  if (error) return NextResponse.json({ error: "Profil belum bisa disimpan. Periksa data lalu coba lagi." }, { status: 400 });

  await supabase.from("profiles").upsert({
    id: user.id,
    name,
    email,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ user: mapAuthUser(data.user) });
}
