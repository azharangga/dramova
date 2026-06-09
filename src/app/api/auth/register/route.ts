import { NextResponse } from "next/server";
import { mapAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";

function authError(message: string) {
  if (message === "User already registered") return "Email sudah terdaftar. Silakan login.";
  if (message === "Email not confirmed") return "Email belum aktif. Nonaktifkan email confirmation di Supabase Auth settings.";
  return message;
}

export async function POST(request: Request) {
  const { name, email, password } = await request.json().catch(() => ({ name: "", email: "", password: "" }));
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: String(password || ""),
    options: { data: { name: cleanName } },
  });

  if (error) return NextResponse.json({ error: authError(error.message) }, { status: 400 });

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      name: cleanName,
      email: cleanEmail,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ user: mapAuthUser(data.user) });
}
