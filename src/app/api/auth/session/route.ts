import { NextResponse } from "next/server";
import { mapAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Fetch profile to get role and ban status
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url, role, is_banned, created_at, updated_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ user: mapAuthUser(user, profile) });
}
