"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mapAuthUser, type AuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/client";
import { trackActivity } from "@/lib/activity";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken: string) => Promise<{ user?: AuthUser | null; error?: string }>;
  register: (name: string, email: string, password: string, turnstileToken: string) => Promise<{ user?: AuthUser | null; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
  if (message === "Unauthorized") return "Sesi belum aktif. Silakan coba masuk lagi.";
  if (message === "Invalid login credentials") return "Email atau password salah";
  if (message === "User already registered") return "Email sudah terdaftar. Silakan login.";
  if (message === "Email not confirmed") return "Email belum aktif. Nonaktifkan email confirmation di Supabase Auth settings.";
  if (message === "Akun Anda telah di-banned. Silakan hubungi admin.") return message;
  return message;
}

async function postAuth<T extends object>(url: string, body: Record<string, unknown>): Promise<T | { error: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) return { error: data.error || "Terjadi kesalahan" };
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/auth/session", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { user?: AuthUser | null };
    setUser(data.user ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      refreshUser();
    });
    return () => subscription.unsubscribe();
  }, [refreshUser, supabase]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken: string) => {
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) return { error: "Verifikasi keamanan gagal. Muat ulang challenge dan coba lagi." };

      const result = await postAuth<{ user?: AuthUser | null }>("/api/auth/login", { email, password });
      if ("error" in result) return { error: authError(result.error) };
      setUser(result.user ?? null);
      setIsLoading(false);
      await trackActivity({ type: "login", metadata: { email } });
      return { user: result.user ?? null };
    },
    [refreshUser, supabase],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, turnstileToken: string) => {
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) return { error: "Verifikasi keamanan gagal. Muat ulang challenge dan coba lagi." };

      const result = await postAuth<{ user?: AuthUser | null }>("/api/auth/register", { name, email, password });
      if ("error" in result) return { error: authError(result.error) };

      setUser(result.user ?? null);
      setIsLoading(false);
      await trackActivity({ type: "register", metadata: { email } });
      return { user: result.user ?? null };
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
