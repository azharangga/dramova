import { NextResponse } from "next/server";
import { mapAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";

function authError(message: string) {
  if (message === "Invalid login credentials") return "Email atau password salah";
  if (message === "Email not confirmed") return "Email belum aktif. Nonaktifkan email confirmation di Supabase Auth settings.";
  return message;
}

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({ email: "", password: "" }));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim().toLowerCase(),
    password: String(password || ""),
  });

  if (error) return NextResponse.json({ error: authError(error.message) }, { status: 400 });
  return NextResponse.json({ user: mapAuthUser(data.user) });
}
