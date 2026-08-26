import type { User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string | null;
};

export function mapAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || null,
    createdAt: user.created_at || null,
  };
}
