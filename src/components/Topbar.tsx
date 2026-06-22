"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  async function handleLogout() {
    await logout();
    toast.success("Berhasil Keluar", { description: "Sampai jumpa lagi!" });
    router.push("/login");
    router.refresh();
  }

  function handleThemeToggle() {
    const dramova = window as typeof window & { Dramova?: { toggleTheme?: () => void } };
    if (dramova.Dramova?.toggleTheme) {
      dramova.Dramova.toggleTheme();
      return;
    }
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    localStorage.setItem("dramova.theme", JSON.stringify(next));
    root.setAttribute("data-theme", next);
    root.classList.toggle("light", next === "light");
    document.dispatchEvent(new CustomEvent("theme:changed", { detail: next }));
  }

  return (
    <header id="topBar" className="topbar-shell sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:gap-4 md:grid md:grid-cols-[1fr_auto_1fr] lg:h-16">
        <a href="/" className="topbar-brand flex shrink-0 items-center" aria-label="Dramova">
          <img src="/img/logo.png" alt="Dramova" className="h-5.5" style={{ width: "auto" }} />
        </a>
        <nav className="hidden justify-self-center md:flex items-center gap-1.5 rounded-full p-1" aria-label="Navigasi desktop" style={{ background: "color-mix(in srgb, var(--bg-raised) 78%, transparent)", border: "1px solid var(--border-color)" }}>
          <a href="/" data-route="/" className="dnav-link inline-flex h-8 items-center px-4 text-sm font-bold transition" style={{ borderRadius: "9999px", color: "var(--text-secondary)", letterSpacing: "0.14px" }}><span data-i18n="nav.home">Beranda</span></a>
          <a href="/discover" data-route="/discover" className="dnav-link inline-flex h-8 items-center px-4 text-sm font-bold transition" style={{ borderRadius: "9999px", color: "var(--text-secondary)", letterSpacing: "0.14px" }}><span data-i18n="nav.discover">Jelajahi</span></a>
          <a href="/series" data-route="/series" className="dnav-link inline-flex h-8 items-center px-4 text-sm font-bold transition" style={{ borderRadius: "9999px", color: "var(--text-secondary)", letterSpacing: "0.14px" }}><span data-i18n="nav.serial">Serial</span></a>
          <a href="/movie" data-route="/movie" className="dnav-link inline-flex h-8 items-center px-4 text-sm font-bold transition" style={{ borderRadius: "9999px", color: "var(--text-secondary)", letterSpacing: "0.14px" }}><span data-i18n="nav.movie">Movie</span></a>
          <a href="/party" data-route="/party" className="dnav-link inline-flex h-8 items-center px-4 text-sm font-bold transition" style={{ borderRadius: "9999px", color: "var(--text-secondary)", letterSpacing: "0.14px" }}><span data-i18n="nav.party">Nobar</span></a>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0 md:justify-self-end" suppressHydrationWarning>
          <a href="/search" aria-label="Cari" className="hidden h-9 w-9 shrink-0 place-items-center border transition hover:opacity-80 active:scale-90 md:grid" style={{ borderRadius: "50%", borderColor: "var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)" }} suppressHydrationWarning>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </a>
          <a href="/search" aria-label="Cari" className="grid h-9 w-9 shrink-0 place-items-center border transition active:scale-90 md:hidden" style={{ borderRadius: "50%", borderColor: "var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)" }} suppressHydrationWarning>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </a>
          <button id="themeToggleBtn" type="button" aria-label="Aktifkan mode terang" onClick={handleThemeToggle} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition hover:opacity-80 active:scale-90" style={{ borderRadius: "50%", borderColor: "var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)" }} suppressHydrationWarning>
            <span className="icon-moon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg></span>
            <span className="icon-sun"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg></span>
          </button>
          <button id="langBtn" aria-label="Ganti bahasa" className="flex h-9 shrink-0 items-center gap-1.5 px-3 text-xs font-bold transition hover:opacity-80 active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-primary)", letterSpacing: "1.4px", textTransform: "uppercase" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            <span id="langLabel">ID</span>
          </button>
          <div ref={profileMenuRef} className={`auth-user-menu${profileOpen ? " is-open" : ""}`}>
            <button className="auth-user-trigger" aria-label="Menu profil" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : <User size={16} />}
            </button>
            <div className="auth-user-dropdown">
              <div className="auth-user-info">
                <strong>{user?.name || "Pengguna"}</strong>
                <span>{user?.email || ""}</span>
              </div>
              <a href="/profile" onClick={() => setProfileOpen(false)}><User size={15} />Profile</a>
              <a href="/history" onClick={() => setProfileOpen(false)}><History size={15} />Riwayat</a>
              <button onClick={handleLogout}><LogOut size={15} />Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
