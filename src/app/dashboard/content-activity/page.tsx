"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  History, 
  Search, 
  RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardBadge,
  ShimmerBar,
} from "@/components/dashboard/DashboardComponents";

interface WatchRecord {
  id: number;
  user_id: string;
  content_type: string;
  platform: string;
  content_id: string;
  episode: number;
  title: string | null;
  cover_url: string | null;
  position_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

interface TopContentItem {
  title: string;
  platform: string;
  contentType: string;
  coverUrl: string | null;
  totalViews: number;
  completedCount: number;
  lastWatched: string;
}

export default function ContentActivityPage() {
  const { t } = useAdmin();
  const [records, setRecords] = useState<WatchRecord[]>([]);
  const [topContent, setTopContent] = useState<TopContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchActivity = useCallback(async (isManualRefresh = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/content-activity?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setRecords(data.records || []);
      setTopContent(data.topContent || []);
      setTotalCount(data.totalCount || 0);
      if (isManualRefresh) {
        toast.success("Aktivitas konten berhasil disegarkan");
      }
    } catch {
      if (isManualRefresh) {
        toast.error("Gagal memuat aktivitas tontonan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, platformFilter, typeFilter]);

  // Realtime search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivity(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchActivity]);

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "-";
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title={t("contentActivity", "Aktivitas Konten")}
        description="Agregasi dan audit pemutaran konten berdasarkan riwayat tontonan pengguna di database."
        count={totalCount}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivity(true)}
            disabled={isLoading}
            className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#3ecf8e]" : "text-zinc-600 dark:text-zinc-400"}`} />
            <span>{t("refresh", "Segarkan")}</span>
          </Button>
        }
      />

      {/* 2. Top Watched Content Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Peringkat Konten Terpopuler
          </h2>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Top 4 tayangan terbanyak</span>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
                <div className="flex justify-between">
                  <ShimmerBar className="h-5 w-5 rounded-full" />
                  <ShimmerBar className="h-4 w-14 rounded-md" />
                </div>
                <ShimmerBar className="h-4 w-3/4" />
                <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <ShimmerBar className="h-3 w-16" />
                  <ShimmerBar className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : topContent.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Belum ada data tontonan teragregasi
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topContent.slice(0, 4).map((item, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 font-mono text-[10px] font-bold text-white dark:text-zinc-900">
                      #{idx + 1}
                    </span>
                    <DashboardBadge variant="neutral" size="sm">
                      {item.platform}
                    </DashboardBadge>
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={item.title}>
                    {item.title}
                  </h3>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                  <span>{item.totalViews} sesi</span>
                  <span className="text-[#3ecf8e] font-semibold">{item.completedCount} tuntas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Realtime Search and Filters (Tanpa Tombol Cari) */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              placeholder="Cari judul konten, platform, atau ID secara realtime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e] rounded-md"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Platform Select */}
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="h-9 w-[140px] text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                <SelectItem value="all" className="text-xs">Semua Platform</SelectItem>
                <SelectItem value="goodshort" className="text-xs">GoodShort</SelectItem>
                <SelectItem value="dramabite" className="text-xs">DramaBite</SelectItem>
                <SelectItem value="dramabox" className="text-xs">DramaBox</SelectItem>
                <SelectItem value="dramanova" className="text-xs">DramaNova</SelectItem>
                <SelectItem value="kdrama" className="text-xs">K-Drama</SelectItem>
                <SelectItem value="cdrama" className="text-xs">C-Drama</SelectItem>
                <SelectItem value="kmovie" className="text-xs">K-Movie</SelectItem>
                <SelectItem value="cmovie" className="text-xs">C-Movie</SelectItem>
                <SelectItem value="loklok" className="text-xs">Loklok</SelectItem>
                <SelectItem value="bilibili" className="text-xs">Bilibili</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Select */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[120px] text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                <SelectItem value="all" className="text-xs">Semua Tipe</SelectItem>
                <SelectItem value="series" className="text-xs">Serial</SelectItem>
                <SelectItem value="movie" className="text-xs">Movie</SelectItem>
                <SelectItem value="shorts" className="text-xs">Shorts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 4. Watch History Table with Column '#' */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-3 w-10 text-center">#</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Konten</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Platform</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Tipe</TableHead>
                <TableHead className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Episode</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Progress</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Status Selesai</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Waktu Tonton</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-200 dark:border-zinc-800">
                    <TableCell className="py-3 px-3 text-center"><ShimmerBar className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <ShimmerBar className="h-4 w-36" />
                        <ShimmerBar className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-14 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-12" /></TableCell>
                    <TableCell className="py-3 px-4 text-center"><ShimmerBar className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-14 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableCell colSpan={8} className="py-12">
                    <DashboardEmptyState
                      icon={<History className="h-8 w-8 mx-auto" />}
                      title="Riwayat Tontonan Kosong"
                      description="Belum ada aktivitas menonton yang tercatat atau sesuai dengan kata kunci filter."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec, index) => {
                  const posMinutes = Math.floor((rec.position_seconds || 0) / 60);
                  const durMinutes = Math.floor((rec.duration_seconds || 0) / 60);
                  return (
                    <TableRow key={rec.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <TableCell className="py-3 px-3 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {index + 1}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="truncate max-w-[260px]">
                          <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate" title={rec.title || rec.content_id}>
                            {rec.title || rec.content_id}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            ID: {rec.content_id}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <DashboardBadge variant="neutral" size="sm">
                          {rec.platform}
                        </DashboardBadge>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                        {rec.content_type}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center text-xs font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {rec.episode}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                        {posMinutes}m / {durMinutes > 0 ? `${durMinutes}m` : "-"}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {rec.completed ? (
                          <DashboardBadge variant="success" size="sm">
                            Selesai
                          </DashboardBadge>
                        ) : (
                          <DashboardBadge variant="neutral" size="sm">
                            Menonton
                          </DashboardBadge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(rec.last_watched_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
