"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Moon, 
  Sun, 
  Languages, 
  LogOut, 
  Settings, 
  Command,
  User as UserIcon,
  Check,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/context/AdminContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme, language, setLanguage, t } = useAdmin();

  const [searchOpen, setSearchOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    const handleToggle = () => setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  const breadcrumbMap: Record<string, string> = {
    "/dashboard": t("overview", "Ringkasan"),
    "/dashboard/users": t("users", "Pengguna"),
    "/dashboard/watch-parties": t("watchParties", "Watch Party"),
    "/dashboard/content-activity": t("contentActivity", "Aktivitas Konten"),
    "/dashboard/audit-logs": t("auditLogs", "Log Audit"),
    "/dashboard/settings": t("settings", "Pengaturan Akun"),
  };

  const pageLabel = breadcrumbMap[pathname] || pathname.split("/").pop() || "";

  const handleLogout = async () => {
    toast.info("Mengakhiri sesi admin...");
    await logout();
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // announcements / Layanan Sistem removed completely
  const quickNavItems = [
    { title: t("dashboard", "Dasbor Utama"), href: "/dashboard", desc: "Overview platform dan metrik" },
    { title: t("users", "Manajemen Pengguna"), href: "/dashboard/users", desc: "Daftar akun dan hak akses" },
    { title: t("watchParties", "Watch Party"), href: "/dashboard/watch-parties", desc: "Monitoring sesi room nobar" },
    { title: t("contentActivity", "Aktivitas Konten"), href: "/dashboard/content-activity", desc: "Riwayat dan tren tontonan" },
    { title: t("auditLogs", "Log Audit"), href: "/dashboard/audit-logs", desc: "Keamanan dan jejak aksi admin" },
    { title: t("settings", "Pengaturan Akun"), href: "/dashboard/settings", desc: "Profil dan keamanan superuser" },
  ];

  const filteredNav = quickNavItems.filter((item) =>
    item.title.toLowerCase().includes(navQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(navQuery.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#161618]/90 backdrop-blur-md px-3 sm:px-4 lg:px-6 transition-colors duration-200 font-sans">
        {/* Left section: Hamburger button, Collapse Toggle, and breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors lg:hidden cursor-pointer shrink-0"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:grid h-8 w-8 place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </TooltipContent>
          </Tooltip>

          <nav className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 min-w-0 truncate ml-1">
            <Link
              href="/dashboard"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium shrink-0"
            >
              {t("dashboard", "Dasbor")}
            </Link>
            {pathname !== "/dashboard" && (
              <>
                <span className="text-zinc-400 dark:text-zinc-600 shrink-0">/</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize truncate">
                  {pageLabel}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right section: Search bar, Language toggle, Theme 1-click toggle, Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 1. Search Bar Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors cursor-pointer w-44 lg:w-56"
          >
            <Search className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            <span className="flex-1 text-left truncate">{t("searchPlaceholder", "Cari atau lompat ke...")}</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 shrink-0 shadow-2xs">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>

          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden h-8 w-8 grid place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          {/* 2. Language Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 px-2 flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-xs font-semibold">
                    <Languages className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.75} />
                    <span className="uppercase text-[11px] font-mono">{language}</span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("switchLanguage", "Pilih Bahasa")}</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-40 p-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-md">
              <DropdownMenuItem
                onClick={() => setLanguage("id")}
                className="flex items-center justify-between text-xs py-1.5 cursor-pointer rounded"
              >
                <span>Indonesia (ID)</span>
                {language === "id" && <Check className="h-3.5 w-3.5 text-[#2BA641]" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("en")}
                className="flex items-center justify-between text-xs py-1.5 cursor-pointer rounded"
              >
                <span>English (EN)</span>
                {language === "en" && <Check className="h-3.5 w-3.5 text-[#2BA641]" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Theme Toggle (1-Click icon button) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("toggleTheme", "Ubah Tema")}
            className="h-8 w-8 grid place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-zinc-300 hover:text-white" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700 hover:text-zinc-900" strokeWidth={1.75} />
            )}
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          {/* 4. User Profile Dropdown (Clean) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-[#2BA641]/30 focus:outline-none cursor-pointer ml-1">
                    <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user?.name || "User"} />
                      ) : null}
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{user?.name || t("profile", "Profil Akun")}</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-56 p-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-lg">
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || "Super Admin"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate lowercase">
                    {user?.email || "admin@dramova.site"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 border-zinc-200 dark:border-zinc-800" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer text-xs py-1.5 rounded">
                  <Settings className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                  <span>{t("settings", "Pengaturan Akun")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-zinc-200 dark:border-zinc-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-xs py-1.5 text-[#ff2201] focus:text-[#ff2201] focus:bg-[#ff2201]/10 rounded"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{t("logout", "Keluar Sesi")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Quick Search Modal Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md p-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xl rounded-lg overflow-hidden font-sans">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("searchPlaceholder", "Cari atau lompat ke...")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3.5">
            <Search className="h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0" strokeWidth={1.75} />
            <Input
              placeholder={t("searchPlaceholder", "Cari atau lompat ke...")}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-11 bg-transparent px-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              autoFocus
            />
          </div>
          <div className="p-2 max-h-72 overflow-y-auto space-y-1">
            {filteredNav.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Tidak ada menu yang sesuai dengan kata kunci
              </p>
            ) : (
              filteredNav.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(item.href);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-md text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-xs cursor-pointer group"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#2BA641] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Buka ↵
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
