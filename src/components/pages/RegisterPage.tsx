"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Turnstile } from "react-turnstile";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, User, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;

function resetTurnstile(setToken: (token: string | null) => void, setKey: React.Dispatch<React.SetStateAction<number>>) {
  setToken(null);
  setKey((key) => key + 1);
}

export function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => [
    { id: "len", label: "Minimal 8 karakter", ok: password.length >= 8 },
    { id: "lower", label: "Huruf kecil (a-z)", ok: /[a-z]/.test(password) },
    { id: "upper", label: "Huruf besar (A-Z)", ok: /[A-Z]/.test(password) },
    { id: "num", label: "Angka (0-9)", ok: /[0-9]/.test(password) },
    { id: "sym", label: "Simbol (!@#$..)", ok: /[^A-Za-z0-9]/.test(password) },
  ], [password]);
  const score = checks.filter((c) => c.ok).length;
  const strengthClass = `score-${score}`;
  const strength = password.length === 0 ? "—" : score <= 1 ? "Lemah" : score <= 2 ? "Cukup" : score <= 3 ? "Baik" : score === 4 ? "Kuat" : "Sangat Kuat";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 60 || !namePattern.test(cleanName)) {
      toast.error("Format Nama Salah", { description: "Gunakan huruf, spasi, titik, atau hubung." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Email Tidak Valid", { description: "Pastikan format email sudah benar." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (score < 5) {
      toast.error("Password Lemah", { description: "Gunakan kombinasi yang lebih kuat." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (password !== confirm) {
      toast.error("Password Berbeda", { description: "Konfirmasi password tidak cocok." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (!acceptedTerms) {
      toast.error("Persetujuan Dibutuhkan", { description: "Anda harus menyetujui S&K." });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      return;
    }
    if (!turnstileToken) {
      toast.error("Verifikasi Gagal", { description: "Selesaikan verifikasi keamanan." });
      return;
    }

    setLoading(true);
    const { error } = await register(cleanName, cleanEmail, password, turnstileToken);
    if (error) {
      toast.error("Pendaftaran Gagal", { description: error });
      resetTurnstile(setTurnstileToken, setTurnstileKey);
      setLoading(false);
      return;
    }
    toast.success("Pendaftaran Berhasil", { description: `Selamat datang, ${cleanName.split(" ")[0].replace(/[^a-zA-Z]/g, "")}!` });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <main className="auth-main auth-main-scroll">
        <div className="auth-top">
          <Link href="/" className="auth-back"><ArrowLeft size={14} />Kembali ke Login</Link>
        </div>
        <div className="auth-card-wrap">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="auth-form-card">
            <div className="auth-heading">
              <p>Buat Akun</p>
              <h2>Mulai menonton dengan akunmu.</h2>
              <span>Daftar untuk menyimpan progres tontonan dan riwayat.</span>
            </div>
            <form onSubmit={onSubmit} className="auth-form" noValidate>
              <label><span>Nama lengkap</span><div className="auth-field"><User size={16} /><input autoComplete="name" placeholder="Masukkan nama lengkap" value={name} onChange={(e) => setName(e.target.value)} /></div></label>
              <label><span>Email</span><div className="auth-field"><Mail size={16} /><input type="email" autoComplete="email" placeholder="kamu@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
              <label><span>Password</span><div className="auth-field"><Lock size={16} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Buat password yang kuat" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
              <div className="auth-strength">
                <div className={`auth-strength-bars ${strengthClass}`}>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < score ? "is-on" : ""} />)}<b>{strength}</b></div>
                <ul>{checks.map((c) => <li key={c.id} className={c.ok ? "is-ok" : ""}>{c.ok ? <Check size={12} /> : <X size={12} />}{c.label}</li>)}</ul>
              </div>
              <label><span>Konfirmasi password</span><div className="auth-field"><Lock size={16} /><input type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Ulangi password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><button type="button" onClick={() => setShowConfirm((v) => !v)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
              {confirm && <p className={`auth-inline-status ${password === confirm ? "is-ok" : "is-error"}`}>{password === confirm ? <Check size={12} /> : <X size={12} />}{password === confirm ? "Password cocok" : "Password tidak cocok"}</p>}
              <label className="auth-check-row">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span>Saya menyetujui ketentuan layanan dan kebijakan privasi.</span>
              </label>
              <div className="auth-turnstile">
                <Turnstile key={turnstileKey} sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} theme="auto" appearance="always" size="flexible" />
              </div>
              <button className="auth-submit" disabled={loading || !turnstileToken || !acceptedTerms}>{loading ? <><Loader2 className="animate-spin" size={16} />Memproses...</> : <>Buat Akun<ArrowRight size={16} /></>}</button>
            </form>
            <p className="auth-switch">Sudah punya akun? <Link href="/login">Masuk</Link></p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
