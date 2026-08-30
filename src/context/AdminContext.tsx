"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "dark" | "light" | "system";
export type Language = "id" | "en";

const translations: Record<Language, Record<string, string>> = {
  id: {
    dashboard: "Dashboard",
    users: "Manajemen Pengguna",
    watchParties: "Nonton Bareng",
    contentActivity: "Aktivitas Konten",
    auditLogs: "Log Audit Security",
    settings: "Pengaturan Akun",
    overview: "Ringkasan Platform",
    totalUsers: "Total Pengguna",
    activeWatchParties: "Nobar Aktif",
    watchSessions: "Sesi Menonton",
    activity24h: "Aktivitas 24 Jam",
    searchPlaceholder: "Cari atau lompat ke...",
    profile: "Profil Akun",
    logout: "Keluar Sesi",
    dark: "Dark Mode",
    light: "Light Mode",
    systemTheme: "Sistem OS",
    indonesian: "Indonesia (ID)",
    english: "English (EN)",
    refresh: "Segarkan",
    superuserBadge: "Superuser Workspace",
    platformDesc: "Panel kendali terpusat operasional dan infrastruktur Dramova",
    quickActions: "Tindakan Cepat",
    recentWatchParties: "Room Nobar Terkini",
    noWatchPartyActivity: "Belum ada aktivitas Nonton Bareng",
    cleanupParties: "Bersihkan Room Usang",
    viewAll: "Lihat Semua",
    filter: "Filter Data",
    status: "Status",
    role: "Peran",
    actions: "Tindakan",
    created: "Dibuat",
    details: "Detail Selengkapnya",
    noData: "Tidak ada data ditemukan",
    banned: "Terblokir",
    active: "Aktif",
    superuser: "Superuser",
    user: "User Biasa",
    all: "Semua",
    confirmAction: "Konfirmasi Tindakan",
    cancel: "Batal",
    save: "Simpan Perubahan",
    toggleTheme: "Ubah Tema",
    switchLanguage: "Pilih Bahasa",
    backToApp: "Kembali ke Aplikasi",
    footerMadeBy: "Dibuat oleh Azharangga Kusuma.",
    footerCopyright: "© 2026 Dramova. All rights reserved.",
    chartPlayTrend: "Tren Sesi Tontonan",
    chartContentFormat: "Distribusi Format Konten",
    profileSettings: "Pengaturan Profil dan Keamanan",
    personalDetails: "Informasi Profil",
    securitySettings: "Keamanan Password",
    changeAvatar: "Ganti Foto Profil",
    uploadAvatar: "Upload Foto Profil",
    fullName: "Nama Lengkap",
    emailAddress: "Alamat Email",
    currentPassword: "Password Saat Ini",
    newPassword: "Password Baru",
    confirmNewPassword: "Konfirmasi Password Baru",
    saveProfileSuccess: "Profil berhasil diperbarui",
    changePasswordSuccess: "Password berhasil diperbarui, silakan login ulang",
    editUser: "Edit Data Pengguna",
    createUser: "Tambah Pengguna",
    deleteUser: "Hapus Pengguna Permanen",
    deleteConfirm: "Apakah Anda yakin ingin menghapus data ini secara permanen?",
    totalUsersHint: "Akun terdaftar dan terverifikasi di platform",
    activePartiesHint: "Sesi nonton bareng yang sedang berjalan live",
    totalWatchEntriesHint: "Total riwayat pemutaran video seluruh pengguna",
    activity24hHint: "Interaksi pengguna dan room terkini",
    serverMonitoring: "Monitoring Server",
    serverMonitoringDesc: "Pantau performa, latensi, dan status infrastruktur server secara real-time.",
    autoRefresh: "Auto-Refresh",
    pingWakeUp: "Ping / Wake-Up Server",
    responseLatency: "Response Latency",
    queryLatency: "Query Latency",
    hardwareSpecs: "Hardware Specs",
    targetEndpoint: "Target Endpoint",
    edgeCaching: "Edge Caching",
    swrRevalidation: "SWR Revalidation",
    videoSegmentCache: "Video Segment Cache",
    latestDeployment: "Latest Deployment",
    activePoolConnections: "Active Pool Connections",
    databaseSize: "Database Size",
    liveLatencyLog: "Live Latency Log (Realtime Polling)",
    serverUptime: "Server Uptime",
    nodeVersion: "Node Version",
    heapMemory: "Heap Memory",
    architecture: "Architecture",
    openVercelDashboard: "Buka Vercel Dashboard",
    openSupabaseStudio: "Buka Supabase Studio",
    showEndpoint: "Tampilkan",
    hideEndpoint: "Sembunyikan",
    operational: "Operational",
    waitingFirstPoll: "Menunggu polling pertama...",
    onlineStatus: "Online",
    offlineStatus: "Offline",
    slowStatus: "Lambat",
    healthyStatus: "Healthy",
    degradedStatus: "Degraded",
    lastCheck: "Pengecekan terakhir",
  },
  en: {
    dashboard: "Main Dashboard",
    users: "User Management",
    watchParties: "Watch Parties",
    contentActivity: "Content Activity",
    auditLogs: "Security Audit Logs",
    settings: "Account Settings",
    overview: "Platform Overview",
    totalUsers: "Total Users",
    activeWatchParties: "Active Watch Parties",
    watchSessions: "Watch Sessions",
    activity24h: "24h Activity",
    searchPlaceholder: "Search or jump to...",
    profile: "Account Profile",
    logout: "Sign Out",
    dark: "Dark Mode",
    light: "Light Mode",
    systemTheme: "System Theme",
    indonesian: "Indonesian (ID)",
    english: "English (EN)",
    refresh: "Refresh",
    superuserBadge: "Superuser Workspace",
    platformDesc: "Central control panel for Dramova backend infrastructure",
    quickActions: "Quick Actions",
    recentWatchParties: "Recent Watch Parties",
    noWatchPartyActivity: "No Watch Party activity found",
    cleanupParties: "Clean Expired Parties",
    viewAll: "View All",
    filter: "Filter Data",
    status: "Status",
    role: "Role",
    actions: "Actions",
    created: "Created",
    details: "More Details",
    noData: "No data found",
    banned: "Banned",
    active: "Active",
    superuser: "Superuser",
    user: "Standard User",
    all: "All",
    confirmAction: "Confirm Action",
    cancel: "Cancel",
    save: "Save Changes",
    toggleTheme: "Toggle Theme",
    switchLanguage: "Select Language",
    backToApp: "Back to Application",
    footerMadeBy: "Made by Azharangga Kusuma.",
    footerCopyright: "© 2026 Dramova. All rights reserved.",
    chartPlayTrend: "Watch Session Trends",
    chartContentFormat: "Content Format Distribution",
    profileSettings: "Profile and Security Settings",
    personalDetails: "Personal Details",
    securitySettings: "Password Security",
    changeAvatar: "Change Avatar",
    uploadAvatar: "Upload Avatar",
    fullName: "Full Name",
    emailAddress: "Email Address",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    saveProfileSuccess: "Profile updated successfully",
    changePasswordSuccess: "Password updated successfully, please log in again",
    editUser: "Edit User Data",
    createUser: "Add New User",
    deleteUser: "Delete User Permanently",
    deleteConfirm: "Are you sure you want to permanently delete this data?",
    totalUsersHint: "Registered and verified platform accounts",
    activePartiesHint: "Watch party sessions currently running live",
    totalWatchEntriesHint: "Total video playback history across all users",
    activity24hHint: "Recent user and room interactions",
    serverMonitoring: "Server Monitoring",
    serverMonitoringDesc: "Real-time monitoring of server infrastructure performance, latency, and operational status.",
    autoRefresh: "Auto-Refresh",
    pingWakeUp: "Ping / Wake-Up Server",
    responseLatency: "Response Latency",
    queryLatency: "Query Latency",
    hardwareSpecs: "Hardware Specs",
    targetEndpoint: "Target Endpoint",
    edgeCaching: "Edge Caching",
    swrRevalidation: "SWR Revalidation",
    videoSegmentCache: "Video Segment Cache",
    latestDeployment: "Latest Deployment",
    activePoolConnections: "Active Pool Connections",
    databaseSize: "Database Size",
    liveLatencyLog: "Live Latency Log (Realtime Polling)",
    serverUptime: "Server Uptime",
    nodeVersion: "Node Version",
    heapMemory: "Heap Memory",
    architecture: "Architecture",
    openVercelDashboard: "Open Vercel Dashboard",
    openSupabaseStudio: "Open Supabase Studio",
    showEndpoint: "Show",
    hideEndpoint: "Hide",
    operational: "Operational",
    waitingFirstPoll: "Waiting for first polling...",
    onlineStatus: "Online",
    offlineStatus: "Offline",
    slowStatus: "Slow",
    healthyStatus: "Healthy",
    degradedStatus: "Degraded",
    lastCheck: "Last check",
  },
};

interface AdminContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [language, setLanguageState] = useState<Language>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(media.matches ? "dark" : "light");

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", listener);

    const savedTheme = localStorage.getItem("dramova_admin_theme") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Default to light theme initially if not set
      setThemeState("light");
    }

    const savedLang = localStorage.getItem("dramova_admin_lang") as Language;
    if (savedLang) setLanguageState(savedLang);

    return () => media.removeEventListener("change", listener);
  }, []);

  const resolvedTheme: "dark" | "light" = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dramova_admin_theme", newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem("dramova_admin_lang", newLang);
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language] || translations.id;
    return dict[key] || defaultText || key;
  };

  return (
    <AdminContext.Provider value={{ theme, setTheme, resolvedTheme, language, setLanguage, t }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
