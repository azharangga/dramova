"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Tv, 
  History, 
  Activity, 
  RefreshCw, 
  Sparkles,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardStatCard,
  DashboardBadge,
  DashboardEmptyState,
  ShimmerBar,
  StatusDot,
  InteractiveAreaChart,
  InteractiveDonutChart,
} from "@/components/dashboard/DashboardComponents";

interface DashboardStats {
  metrics: {
    totalUsers: number;
    superusersCount: number;
    bannedUsersCount: number;
    totalRooms: number;
    activeRooms: number;
    totalWatchEntries: number;
    completedWatches: number;
    totalActivities: number;
  };
  contentBreakdown: Record<string, number>;
  platformBreakdown: Record<string, number>;
  watchDates?: string[];
  latestUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    is_banned: boolean;
    created_at: string;
  }>;
  latestRooms: Array<{
    id: string;
    code: string;
    title: string;
    content_type: string;
    platform: string;
    content_title: string;
    is_active: boolean;
    created_at: string;
  }>;
  latestActivities: Array<{
    id: number;
    user_id: string;
    activity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  catalogSummary?: {
    totalUnique?: number;
    totalScanned?: number;
    categories?: Array<{
      category: string;
      name: string;
      type: string;
      totalItems: number;
      uniqueInCategory: number;
    }>;
    [key: string]: unknown;
  };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useAdmin();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(0); // 0 means "All Years"

  async function fetchStats() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setStats(data);
    } catch {
      toast.error("Gagal memuat ringkasan data admin");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute available years and 12-month data for the selected year
  const { availableYears, monthlyTrendData } = (() => {
    const dates = stats?.watchDates || [];
    const yearSet = new Set<number>([currentYear]);

    dates.forEach((d) => {
      try {
        const y = new Date(d).getFullYear();
        if (!isNaN(y)) yearSet.add(y);
      } catch {}
    });

    const years = Array.from(yearSet).sort((a, b) => b - a);

    // Initialize 12 months array
    const monthCounts = new Array(12).fill(0);

    dates.forEach((d) => {
      try {
        const dateObj = new Date(d);
        if (selectedYear === 0 || dateObj.getFullYear() === selectedYear) {
          const m = dateObj.getMonth(); // 0 - 11
          monthCounts[m] += 1;
        }
      } catch {}
    });

    const trend = MONTH_NAMES.map((label, idx) => ({
      label,
      value: monthCounts[idx],
    }));

    return { availableYears: years, monthlyTrendData: trend };
  })();

  function formatRelativeDate(isoString: string) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSecs < 60) return "Baru saja";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} mnt lalu`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} jam lalu`;
      return `${Math.floor(diffSecs / 86400)} hari lalu`;
    } catch {
      return "-";
    }
  }

  // Calculate drama catalog breakdown (Serial vs Movie) from catalogSummary.categories
  const catalogBreakdown = (() => {
    if (!stats?.catalogSummary?.categories || !Array.isArray(stats.catalogSummary.categories)) {
      return [
        { label: "Serial", value: 8333, color: "#2BA641" },
        { label: "Movie", value: 4829, color: "#f59e0b" },
      ];
    }

    let serialSum = 0;
    let movieSum = 0;

    stats.catalogSummary.categories.forEach((cat) => {
      const count = Number(cat.totalItems) || 0;
      if (cat.type === "movie") {
        movieSum += count;
      } else {
        serialSum += count;
      }
    });

    return [
      { label: "Serial", value: serialSum, color: "#2BA641" },
      { label: "Movie", value: movieSum, color: "#f59e0b" },
    ];
  })();

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title={t("dashboard", "Dashboard")}
        description={t("platformDesc", "Panel kendali terpusat operasional dan infrastruktur Dramova.")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
              className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#2BA641]" : "text-zinc-500 dark:text-zinc-400"}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Key Metrics 4-up Grid with Descriptive Hints */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardStatCard
          label={t("totalUsers", "Total Pengguna")}
          value={
            isLoading ? (
              <ShimmerBar className="h-7 w-20 my-0.5" />
            ) : (
              stats?.metrics.totalUsers.toLocaleString() ?? 0
            )
          }
          icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
          hint={
            isLoading ? (
              <ShimmerBar className="h-3 w-32 mt-0.5" />
            ) : (
              t("totalUsersHint", "Akun terdaftar dan terverifikasi di platform")
            )
          }
        />

        <DashboardStatCard
          label="Total Drama"
          value={
            isLoading ? (
              <ShimmerBar className="h-7 w-16 my-0.5" />
            ) : (
              (stats?.catalogSummary?.totalUnique ?? 0).toLocaleString()
            )
          }
          icon={<Tv className="h-4 w-4" strokeWidth={1.75} />}
          hint={
            isLoading ? (
              <ShimmerBar className="h-3 w-28 mt-0.5" />
            ) : (
              "Total seluruh drama yang tersedia"
            )
          }
        />

        <DashboardStatCard
          label={t("watchSessions", "Total riwayat pemutaran konten")}
          value={
            isLoading ? (
              <ShimmerBar className="h-7 w-24 my-0.5" />
            ) : (
              stats?.metrics.totalWatchEntries.toLocaleString() ?? 0
            )
          }
          icon={<History className="h-4 w-4" strokeWidth={1.75} />}
          hint={
            isLoading ? (
              <ShimmerBar className="h-3 w-28 mt-0.5" />
            ) : (
              t("watchSessionsHint", "Total riwayat pemutaran konten")
            )
          }
        />

        <DashboardStatCard
          label="Aktivitas Pengguna"
          value={
            isLoading ? (
              <ShimmerBar className="h-7 w-16 my-0.5" />
            ) : (
              (stats?.metrics.totalActivities ?? 0).toLocaleString()
            )
          }
          icon={<Activity className="h-4 w-4" strokeWidth={1.75} />}
          hint={
            isLoading ? (
              <ShimmerBar className="h-3 w-24 mt-0.5" />
            ) : (
              "Total seluruh log aktivitas pengguna"
            )
          }
        />
      </div>

      {/* 3. Interactive Charts (Area Chart + Donut Format Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
              <ShimmerBar className="h-4 w-32" />
              <ShimmerBar className="h-44 w-full" />
            </div>
          ) : (
            <InteractiveAreaChart
              data={monthlyTrendData}
              title={t("chartPlayTrend", "Tren Sesi Tontonan")}
              subtitle="Statistik pemutaran konten"
              years={availableYears}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
            />
          )}
        </div>

        <div className="h-full">
          {isLoading ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4 h-full">
              <ShimmerBar className="h-4 w-32" />
              <ShimmerBar className="h-44 w-full" />
            </div>
          ) : (
            <InteractiveDonutChart
              data={catalogBreakdown}
              title="Katalog Drama"
              subtitle="Proporsi konten Serial dan Movie"
            />
          )}
        </div>
      </div>

      {/* 4. Bottom Grid: Latest Users & Latest Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Users List */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                {t("users", "Pengguna")}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
                Pengguna Terbaru
              </div>
            </div>
            <Link
              href="/dashboard/users"
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-current transition-colors"
            >
              {t("viewAll", "Lihat Semua")}
            </Link>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ShimmerBar className="h-4 w-4" />
                    <ShimmerBar className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <ShimmerBar className="h-3.5 w-28" />
                      <ShimmerBar className="h-3 w-40" />
                    </div>
                    <ShimmerBar className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (stats?.latestUsers || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Belum ada data registrasi pengguna
              </div>
            ) : (
              (stats?.latestUsers || []).slice(0, 5).map((u, index) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 sm:px-4 sm:py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700 shrink-0">
                      {u.avatar_url ? (
                        <AvatarImage src={u.avatar_url} alt={u.name} />
                      ) : null}
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {u.name || "Anonim"}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <DashboardBadge
                      variant={u.role === "superuser" ? "success" : "neutral"}
                      size="sm"
                    >
                      {u.role}
                    </DashboardBadge>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatRelativeDate(u.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Active Rooms List */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("watchParties", "Nonton Bareng")}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
                {t("recentWatchParties", "Room Nobar Terkini")}
              </div>
            </div>
            <Link
              href="/dashboard/watch-parties"
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-current transition-colors"
            >
              {t("viewAll", "Lihat Semua")}
            </Link>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <ShimmerBar className="h-4 w-4" />
                    <div className="space-y-1 flex-1 mx-3">
                      <ShimmerBar className="h-3.5 w-32" />
                      <ShimmerBar className="h-3 w-48" />
                    </div>
                    <ShimmerBar className="h-5 w-14 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (stats?.latestRooms || []).length === 0 ? (
              <div className="py-8 px-4">
                <DashboardEmptyState
                  icon={<Tv className="h-8 w-8 mx-auto" />}
                  title={language === "id" ? "Room Nobar Kosong" : "No Watch Party Rooms"}
                  description={t("noWatchPartyActivity", "Belum ada aktivitas Nonton Bareng")}
                />
              </div>
            ) : (
              (stats?.latestRooms || []).slice(0, 5).map((r, index) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 sm:px-4 sm:py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {r.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {r.content_title || "-"} · <span className="font-mono text-zinc-900 dark:text-zinc-100">#{r.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <DashboardBadge
                      variant={r.is_active ? "success" : "neutral"}
                      size="sm"
                      dot={false}
                    >
                      {r.is_active ? "Live" : "Selesai"}
                    </DashboardBadge>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatRelativeDate(r.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
