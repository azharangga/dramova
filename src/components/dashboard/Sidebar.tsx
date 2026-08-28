"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Tv, 
  History, 
  ShieldAlert, 
  ExternalLink,
  Settings,
  User as UserIcon,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/context/AdminContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function Sidebar({ className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useAdmin();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");

    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    };
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  const navigation: NavGroup[] = [
    {
      group: t("overview", "Ringkasan"),
      items: [
        {
          name: t("dashboard", "Dasbor Utama"),
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      group: t("users", "Manajemen dan Konten"),
      items: [
        {
          name: t("users", "Manajemen Pengguna"),
          href: "/dashboard/users",
          icon: Users,
        },
        {
          name: t("watchParties", "Watch Party"),
          href: "/dashboard/watch-parties",
          icon: Tv,
        },
        {
          name: t("contentActivity", "Aktivitas Konten"),
          href: "/dashboard/content-activity",
          icon: History,
        },
      ],
    },
    {
      group: t("system", "Keamanan dan Pengaturan"),
      items: [
        {
          name: t("auditLogs", "Log Audit"),
          href: "/dashboard/audit-logs",
          icon: ShieldAlert,
        },
        {
          name: t("settings", "Pengaturan Akun"),
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out border-r select-none shrink-0 font-sans",
        "bg-white dark:bg-[#161618] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100",
        isCollapsed ? "w-[68px]" : "w-[240px]",
        className
      )}
    >
      {/* 1. Header: Logo Only (icon.png when collapsed, logo.png when expanded - NO INVERT CLASS) */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 shrink-0 px-4",
          isCollapsed ? "justify-center" : "justify-start"
        )}
      >
        <Link
          href="/"
          className="flex items-center group transition-transform active:scale-95"
          title="Dramova"
        >
          {isCollapsed ? (
            <img
              src="/img/icon.png"
              alt="Dramova Icon"
              className="h-7 w-7 object-contain"
            />
          ) : (
            <img
              src="/img/logo.png"
              alt="Dramova Logo"
              className="h-6 w-auto object-contain"
            />
          )}
        </Link>
      </div>

      {/* 2. Navigation Items (text-sm font-medium, stable CSS instead of Framer layoutId to avoid crash) */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {navigation.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 font-mono">
                {group.group}
              </h4>
            )}
            <ul className="space-y-0.5 pt-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "relative group flex items-center rounded-md text-sm font-medium transition-colors",
                      isCollapsed ? "justify-center h-9 w-9 mx-auto p-0" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-[#2BA641]" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        isActive
                          ? "text-[#2BA641]"
                          : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                      )}
                      strokeWidth={1.75}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 3. Link back to public app */}
      <div className="px-2 py-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <Link
          href="/"
          title={isCollapsed ? t("backToApp", "Kembali ke Aplikasi") : undefined}
          className={cn(
            "flex items-center rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors",
            isCollapsed ? "justify-center h-8 w-8 mx-auto p-0" : "justify-between px-3 py-1.5"
          )}
        >
          {!isCollapsed && <span>{t("backToApp", "Kembali ke Aplikasi")}</span>}
          <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0" />
        </Link>
      </div>

      {/* 4. Bottom Account Profile Superuser */}
      <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? `${user?.name || "Super Admin"} (${user?.email || ""})` : undefined}
          className={cn(
            "flex items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer",
            isCollapsed ? "justify-center p-1" : "gap-2.5 p-1.5"
          )}
        >
          <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700 shrink-0">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user?.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium truncate leading-tight text-zinc-900 dark:text-zinc-100">
                {user?.name || "Super Admin"}
              </span>
              <span className="text-[10px] truncate text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                {user?.email || "admin@dramova.site"}
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
