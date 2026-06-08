"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { trackActivity } from "@/lib/activity";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, turnstileToken: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Pengguna",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || null,
  };
}

async function verifyTurnstile(token: string) {
  const res = await fetch("/api/auth/turnstile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success);
}

function authError(message: string) {
  if (message === "Invalid login credentials") return "Email atau password salah";
  if (message === "User already registered") return "Email sudah terdaftar. Silakan login.";
  if (message === "Email not confirmed") return "Email belum aktif. Nonaktifkan email confirmation di Supabase Auth settings.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refreshUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(mapUser(user));
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    refreshUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [refreshUser, supabase]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken: string) => {
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) return { error: "Verifikasi keamanan gagal. Muat ulang challenge dan coba lagi." };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: authError(error.message) };
      await refreshUser();
      await trackActivity({ type: "login", metadata: { email } });
      return {};
    },
    [refreshUser, supabase],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, turnstileToken: string) => {
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) return { error: "Verifikasi keamanan gagal. Muat ulang challenge dan coba lagi." };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { error: authError(error.message) };

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name,
          email,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        });
      }
      await refreshUser();
      await trackActivity({ type: "register", metadata: { email } });
      return {};
    },
    [refreshUser, supabase],
  );

  const logout = useCallback(async () => {
    await trackActivity({ type: "logout" });
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
