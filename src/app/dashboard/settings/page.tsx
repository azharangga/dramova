"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { User as UserIcon, Lock, Upload, Save, CheckCircle, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/context/AdminContext";
import { DashboardPageHeader } from "@/components/dashboard/DashboardComponents";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { t } = useAdmin();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Pre-fill existing data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Password strength checks matching user page
  const passwordChecks = useMemo(() => [
    { id: "len", label: "Minimal 8 karakter", ok: newPassword.length >= 8 },
    { id: "lower", label: "Huruf kecil", ok: /[a-z]/.test(newPassword) },
    { id: "upper", label: "Huruf besar", ok: /[A-Z]/.test(newPassword) },
    { id: "num", label: "Angka", ok: /[0-9]/.test(newPassword) },
    { id: "sym", label: "Simbol", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const passwordScore = useMemo(() => passwordChecks.filter((c) => c.ok).length, [passwordChecks]);

  // Handle direct client-side upload to match profile/route.ts expectations
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Format Tidak Didukung. Gunakan JPG, PNG, atau WebP.");
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Ukuran Terlalu Besar. Maksimal ukuran foto 2MB.");
    }

    setIsUploadingAvatar(true);
    const toastId = toast.loading("Mengunggah foto profil...");

    try {
      // 1. Compress
      const compressed = await imageCompression(file, { maxSizeMB: 0.35, maxWidthOrHeight: 512, useWebWorker: true });
      const ext = compressed.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;

      // 2. Upload to Supabase Storage Bucket 'avatars'
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: compressed.type });
      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);

      // 4. Update Profile in DB via API Route
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, avatarUrl: newUrl }),
      });
      const profileData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(profileData.error || "Gagal menyimpan foto profil");

      await refreshUser();
      toast.success("Foto profil berhasil diperbarui", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto profil", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama tidak boleh kosong");

    try {
      setIsSavingProfile(true);

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), avatarUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

      toast.success(t("saveProfileSuccess", "Profil berhasil diperbarui"));
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("Semua kolom password harus diisi");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Password baru dan konfirmasi tidak cocok");
    }
    if (passwordScore < 5) {
      return toast.error("Password baru belum memenuhi semua aturan keamanan.");
    }

    try {
      setIsSavingPassword(true);
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui password");
      }

      toast.success(t("changePasswordSuccess", "Password berhasil diperbarui, silakan login ulang"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <DashboardPageHeader
        title={t("settings", "Pengaturan Akun")}
        description={t("profileSettings", "Kelola informasi profil dan pengaturan keamanan akun Superuser Anda.")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profile Details Card */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3.5 mb-5">
            <UserIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("personalDetails", "Informasi Profil")}</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <Avatar className="h-20 w-20 border border-zinc-200 dark:border-zinc-700 shrink-0">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <UserIcon className="h-8 w-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {avatarUrl ? "Ganti Foto Profil" : "Upload Foto Profil"}
                </span>
                <label className="inline-flex h-8 items-center gap-2 px-3 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors">
                  {isUploadingAvatar ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mengunggah...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> Pilih Gambar</>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={isUploadingAvatar} />
                </label>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Rekomendasi 1:1. Maks 2MB (JPG/PNG).</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("fullName", "Nama Lengkap")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#2BA641]/40 focus-visible:border-[#2BA641]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("emailAddress", "Alamat Email")}</label>
                <Input
                  value={email}
                  disabled
                  placeholder="masukkan email..."
                  className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Alamat email superuser terhubung ke Supabase Auth dan tidak dapat diubah di panel ini.</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="h-9 px-4 text-xs font-medium bg-[#2BA641] text-white hover:bg-[#238A36] transition-colors cursor-pointer w-full sm:w-auto"
              >
                {isSavingProfile ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 animate-spin text-white" /> Menyimpan...</span>
                ) : (
                  <span className="flex items-center gap-2"><Save className="h-3.5 w-3.5 text-white" /> {t("save", "Simpan Perubahan")}</span>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Security Password Card */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3.5 mb-5">
            <Lock className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("securitySettings", "Keamanan Password")}</h2>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("currentPassword", "Password Saat Ini")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("newPassword", "Password Baru")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>

            {/* Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="space-y-2 p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Kekuatan Password:</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: passwordScore === 5 ? "#2BA641" : passwordScore >= 3 ? "#f59e0b" : "#ff2201" }}>
                    {passwordScore === 5 ? "Sangat Kuat" : passwordScore >= 3 ? "Sedang" : "Lemah"}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(passwordScore / 5) * 100}%`,
                      backgroundColor: passwordScore === 5 ? "#2BA641" : passwordScore >= 3 ? "#f59e0b" : "#ff2201",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {passwordChecks.map((c) => (
                    <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
                      {c.ok ? (
                        <Check className="h-3 w-3 text-[#2BA641]" />
                      ) : (
                        <X className="h-3 w-3 text-zinc-400" />
                      )}
                      <span className={c.ok ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-500"}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("confirmNewPassword", "Konfirmasi Password Baru")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={isSavingPassword}
                className="h-9 px-4 text-xs font-medium bg-[#2BA641] text-white hover:bg-[#238A36] transition-colors cursor-pointer w-full sm:w-auto"
              >
                {isSavingPassword ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 animate-spin text-white" /> Mengganti...</span>
                ) : (
                  <span className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-white" /> Ganti Password</span>
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
