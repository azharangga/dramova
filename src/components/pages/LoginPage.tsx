"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Turnstile } from "react-turnstile";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

function resetTurnstile(setToken: (token: string | null) => void, setKey: React.Dispatch<React.SetStateAction<number>>) {
  setToken(null);
  setKey((key) => key + 1);
}

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const next = params.get("next") || "/";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Email Tidak Valid", { description: "Pastikan format email sudah benar." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (password.length < 8) {
      toast.error("Password Terlalu Pendek", { description: "Minimal 8 karakter." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (!turnstileToken) {
      toast.error("Verifikasi Gagal", { description: "Selesaikan verifikasi keamanan." });
      return;
    }

    setLoading(true);
    const { user: loggedInUser, error } = await login(cleanEmail, password, turnstileToken);
    if (error) {
      toast.error("Login Gagal", { description: error });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      setLoading(false);
      return;
    }
    toast.success("Berhasil Masuk", { description: "Selamat datang kembali!" });

    // If superuser and no specific deep-link destination was provided, route directly to /dashboard
    const targetPath = next !== "/" ? next : loggedInUser?.role === "superuser" ? "/dashboard" : "/";
    router.push(targetPath);
    router.refresh();
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <main className="auth-main">
        <div className="auth-card-wrap">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="auth-form-card">
            <div className="auth-heading">
              <p>Masuk Akun</p>
              <h2>Selamat datang kembali.</h2>
              <span>Masukkan email dan password untuk melanjutkan.</span>
            </div>
            <form onSubmit={onSubmit} className="auth-form" noValidate>
              <label>
                <span>Email</span>
                <div className="auth-field">
                  <Mail size={16} />
                  <input type="email" autoComplete="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </label>
              <label>
                <span>Password</span>
                <div className="auth-field">
                  <Lock size={16} />
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Min. 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="auth-check-row">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Ingat saya di perangkat ini</span>
              </label>
              <div className="auth-turnstile">
                <Turnstile
                  key={turnstileKey}
                  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  theme="auto"
                  appearance="always"
                  size="flexible"
                />
              </div>
              <button className="auth-submit" disabled={loading || !turnstileToken}>
                {loading ? <><Loader2 className="animate-spin" size={16} />Memproses...</> : <>Masuk Sekarang<ArrowRight size={16} /></>}
              </button>
            </form>
            <p className="auth-switch">Belum punya akun? <Link href="/register">Daftar</Link></p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
