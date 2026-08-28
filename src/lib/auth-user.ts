import type { User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string | null;
  role?: "user" | "superuser" | string;
  isBanned?: boolean;
};

export type ProfileData = {
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_banned?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function mapAuthUser(user: User | null, profile?: ProfileData | null): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
    email: profile?.email || user.email || "",
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    createdAt: profile?.created_at || user.created_at || null,
    role: profile?.role || user.user_metadata?.role || "user",
    isBanned: Boolean(profile?.is_banned ?? user.user_metadata?.is_banned ?? false),
  };
}
