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

  // Fetch profile to get role and ban status
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url, role, is_banned, created_at, updated_at")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.json({ user: mapAuthUser(data.user, profile) });
}
