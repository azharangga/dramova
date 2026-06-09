"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Camera, Check, Eye, EyeOff, Loader2, Lock, Mail, Save, Shield, Trash2, User, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { trackActivity } from "@/lib/activity";
import PageHeader from "@/components/PageHeader";

const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;

export function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?next=/profile");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const checks = useMemo(() => [
    { id: "len", label: "Minimal 8 karakter", ok: newPassword.length >= 8 },
    { id: "lower", label: "Huruf kecil", ok: /[a-z]/.test(newPassword) },
    { id: "upper", label: "Huruf besar", ok: /[A-Z]/.test(newPassword) },
    { id: "num", label: "Angka", ok: /[0-9]/.test(newPassword) },
    { id: "sym", label: "Simbol", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);
  const score = checks.filter((c) => c.ok).length;
  const strengthClass = `score-${score}`;

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 60 || !namePattern.test(cleanName)) {
      toast.error("Nama tidak valid");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Email tidak valid");
      return;
    }

    setSavingProfile(true);
    const id = toast.loading("Menyimpan profil...");
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, avatarUrl: user.avatarUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      toast.error("Gagal menyimpan profil", { id, description: data.error });
      return;
    }
    await refreshUser();
    await trackActivity({ type: "profile_updated", metadata: { changedEmail: cleanEmail !== user.email } });
    toast.success("Profil berhasil diperbarui", { id });
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format foto harus JPG, PNG, atau WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB");
      return;
    }
    setUploadingAvatar(true);
    const id = toast.loading("Mengupload foto...");
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.35, maxWidthOrHeight: 512, useWebWorker: true });
      const ext = compressed.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: compressed.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, avatarUrl }),
      });
      const profileData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(profileData.error || "Gagal menyimpan foto profil");
      await refreshUser();
      await trackActivity({ type: "avatar_updated" });
      toast.success("Foto profil diperbarui", { id });
    } catch (error) {
      toast.error("Gagal upload foto", { id, description: error instanceof Error ? error.message : undefined });
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    if (!currentPassword) return toast.error("Password lama wajib diisi");
    if (score < 5) return toast.error("Password baru belum cukup kuat");
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi password tidak cocok");

    setSavingPassword(true);
    const id = toast.loading("Mengubah password...");
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingPassword(false);
    if (!res.ok) {
      toast.error("Gagal mengubah password", { id, description: data.error });
      return;
    }
    await trackActivity({ type: "password_changed" });
    toast.success("Password berhasil diubah. Silakan login ulang.", { id });
    await logout();
    router.push("/login");
  }

  async function deleteAccount() {
    if (!deletePassword) return toast.error("Masukkan password untuk konfirmasi");
    setDeleting(true);
    const id = toast.loading("Menghapus akun...");
    const res = await fetch("/api/auth/delete", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      toast.error("Gagal menghapus akun", { id, description: data.error });
      return;
    }
    toast.success("Akun berhasil dihapus", { id });
    await logout();
    router.push("/login");
  }

  if (isLoading || !user) {
    return (
      <div className="profile-page">
        <div className="profile-header-skeleton">
          <div className="profile-skeleton-line profile-skeleton-kicker" />
          <div className="profile-skeleton-line profile-skeleton-title" />
          <div className="profile-skeleton-line profile-skeleton-subtitle" />
        </div>
        <div className="profile-shell">
          {[0, 1, 2].map((item) => (
            <section className="profile-section profile-section-skeleton" key={item}>
              <div>
                <div className="profile-skeleton-line profile-skeleton-section-title" />
                <div className="profile-skeleton-line profile-skeleton-section-copy" />
              </div>
              <div className="profile-form">
                <div className="profile-skeleton-line profile-skeleton-field" />
                <div className="profile-skeleton-line profile-skeleton-field" />
                <div className="profile-skeleton-line profile-skeleton-button" />
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <PageHeader
        kicker="Pengaturan"
        kickerI18n="profile.kicker"
        title="Kelola Akun"
        titleI18n="profile.title"
        subtitle="Perbarui informasi profil, password, dan foto akun Dramova."
        subtitleI18n="profile.sub"
      />

      <div className="profile-shell">
        <section className="profile-section">
          <div><h2>Profil</h2><p>Informasi dasar akun yang ditampilkan di aplikasi.</p></div>
          <form onSubmit={saveProfile} className="profile-form">
            <label className="profile-avatar-row">
              <span>Foto Profil</span>
              <div className="profile-avatar-actions">
                <button type="button" className="profile-avatar" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : <User size={28} />}
                  <b>{uploadingAvatar ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}</b>
                </button>
                <button type="button" className="profile-secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>Ganti Foto</button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} />
              </div>
            </label>
            <label><span>Nama lengkap</span><div className="auth-field"><User size={16} /><input placeholder="Masukkan nama lengkap" value={name} onChange={(e) => setName(e.target.value)} /></div></label>
            <label><span>Email</span><div className="auth-field"><Mail size={16} /><input type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
            <button className="profile-primary-btn" disabled={savingProfile}>{savingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}Simpan Profil</button>
          </form>
        </section>

        <section className="profile-section">
          <div><h2>Password</h2><p>Verifikasi password lama sebelum membuat password baru.</p></div>
          <form onSubmit={changePassword} className="profile-form">
            <label><span>Password lama</span><div className="auth-field"><Lock size={16} /><input placeholder="Masukkan password lama" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /><button type="button" onClick={() => setShowCurrent((v) => !v)}>{showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            <label><span>Password baru</span><div className="auth-field"><Lock size={16} /><input placeholder="Buat password baru" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><button type="button" onClick={() => setShowNew((v) => !v)}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            <div className="auth-strength"><div className={`auth-strength-bars ${strengthClass}`}>{[0,1,2,3,4].map((i) => <span key={i} className={i < score ? "is-on" : ""} />)}</div><ul>{checks.map((c) => <li key={c.id} className={c.ok ? "is-ok" : ""}>{c.ok ? <Check size={12} /> : <X size={12} />}{c.label}</li>)}</ul></div>
            <label><span>Konfirmasi password baru</span><div className="auth-field"><Lock size={16} /><input placeholder="Ulangi password baru" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /><button type="button" onClick={() => setShowConfirm((v) => !v)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            {confirmPassword && <p className={`auth-inline-status ${newPassword === confirmPassword ? "is-ok" : "is-error"}`}>{newPassword === confirmPassword ? <Check size={12} /> : <X size={12} />}{newPassword === confirmPassword ? "Password cocok" : "Password tidak cocok"}</p>}
            <button className="profile-warning-btn" disabled={savingPassword}>{savingPassword ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}Ubah Password</button>
          </form>
        </section>

        <section className="profile-section">
          <div><h2>Hapus Akun</h2><p>Tindakan ini permanen dan tidak dapat dibatalkan.</p></div>
          <div className="profile-form">
            <p className="profile-danger-copy">Semua profil, aktivitas, dan riwayat tontonan akan dihapus permanen.</p>
            {!showDelete ? <button className="profile-danger-btn" onClick={() => setShowDelete(true)}><Trash2 size={16} />Hapus Akun Saya</button> : (
              <>
                <label><span>Konfirmasi password</span><div className="auth-field"><Lock size={16} /><input placeholder="Masukkan password akun" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></div></label>
                <button className="profile-danger-btn" onClick={deleteAccount} disabled={deleting}>{deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}Ya, Hapus Permanen</button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
