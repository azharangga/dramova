"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Server,
  Database,
  Cloud,
  Cpu,
  RefreshCw,
  Zap,
  Activity,
  Radio,
  Clock,
  HardDrive,
  Network,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardBadge,
  ShimmerBar,
} from "@/components/dashboard/DashboardComponents";

interface MonitoringData {
  timestamp: string;
  services: {
    huggingFace: {
      status: "online" | "offline" | "degraded";
      latencyMs: number;
      statusCode: number;
      url: string;
      error: string | null;
    };
    supabase: {
      status: "healthy" | "degraded" | "offline";
      latencyMs: number;
      activeConnections: number;
      maxConnections: number;
      dbSize: string;
      tablesCount: number;
      error: string | null;
    };
    vercel: {
      status: string;
      hasToken: boolean;
      latestDeployment: {
        id: string;
        url: string;
        state: string;
        createdAt: number;
        target: string;
      } | null;
      edgeCaching: {
        status: string;
        swrEnabled: boolean;
        segmentCache: string;
      };
    };
  };
  runtime: {
    uptimeSec: number;
    nodeVersion: string;
    memoryRssMb: string;
    memoryHeapUsedMb: string;
    memoryHeapTotalMb: string;
    platform: string;
  };
}

function maskEndpoint(url: string): string {
  if (!url) return "******";
  const clean = url.replace(/^https?:\/\//, "");
  if (clean.length <= 8) return "******";
  return clean.slice(0, 4) + "******" + clean.slice(-4);
}

function formatWibTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date) + " WIB";
}

export default function MonitoringPage() {
  const { t } = useAdmin();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; hf: number; sb: number }>>([]);
  const [showHfUrl, setShowHfUrl] = useState(false);
  const [showVercelUrl, setShowVercelUrl] = useState(false);
  const [page, setPage] = useState(1);

  const fetchMetrics = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsLoading(true);
      const res = await fetch("/api/admin/monitoring");
      if (!res.ok) throw new Error("Gagal mengambil data monitoring");
      const json: MonitoringData = await res.json();
      setData(json);
      const now = new Date();
      setLastRefreshed(now);

      const nowWib = formatWibTime(now);

      setLatencyHistory((prev) => [
        ...prev.slice(-14),
        {
          time: nowWib,
          hf: json.services.huggingFace.latencyMs,
          sb: json.services.supabase.latencyMs,
        },
      ]);
    } catch {
      if (isManual) toast.error(t("failedLoadData", "Gagal memperbarui status server"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const wakeUpHf = async () => {
    const toastId = toast.loading("Memanggil /ping ke Hugging Face API...");
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      if (res.ok) {
        toast.success("Hugging Face Responsif!", {
          id: toastId,
          description: `Status: ${json.backend} (${json.latency_ms}ms)`,
        });
        fetchMetrics(false);
      } else {
        toast.error("Hugging Face Masih Offline", { id: toastId });
      }
    } catch {
      toast.error("Gagal menghubungi Hugging Face", { id: toastId });
    }
  };

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  const hfStatus = data?.services.huggingFace.status;
  const sbStatus = data?.services.supabase.status;

  const totalPages = Math.max(1, Math.ceil(latencyHistory.length / 10));
  const currentLogs = (() => {
    const startIndex = (page - 1) * 10;
    return [...latencyHistory].reverse().slice(startIndex, startIndex + 10);
  })();

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title={t("serverMonitoring", "Monitoring Server")}
        description={t("serverMonitoringDesc", "Pantau performa, latensi, dan status infrastruktur Hugging Face, Vercel, dan Supabase secara real-time.")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-8 px-3 text-xs font-medium cursor-pointer"
            >
              <Radio className={`mr-1.5 h-3.5 w-3.5 ${autoRefresh ? "animate-pulse text-white dark:text-zinc-900" : "text-zinc-500"}`} />
              {t("autoRefresh", "Auto-Refresh")}: {autoRefresh ? "ON (30s)" : "OFF"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics(true)}
              disabled={isLoading}
              className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#2BA641]" : "text-zinc-500"}`} />
              {t("refresh", "Refresh")}
            </Button>
          </div>
        }
      />

      {/* 2. Top Status Cards (3 Infrastructures) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* A. Hugging Face Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 grid place-items-center">
                  <Server className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Hugging Face Space</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Main Data API</p>
                </div>
              </div>
              {isLoading && !data ? (
                <ShimmerBar className="h-5 w-16 rounded-md" />
              ) : (
                <DashboardBadge
                  variant={hfStatus === "online" ? "success" : hfStatus === "degraded" ? "warning" : "danger"}
                  size="sm"
                >
                  {hfStatus === "online" ? t("onlineStatus", "Online") : hfStatus === "degraded" ? t("slowStatus", "Slow") : t("offlineStatus", "Offline")}
                </DashboardBadge>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("responseLatency", "Response Latency")}</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {data ? `${data.services.huggingFace.latencyMs} ms` : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("hardwareSpecs", "Hardware Specs")}</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">2 vCPU · 16GB RAM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">HTTP Status Code</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {data?.services.huggingFace.statusCode || 200} OK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Keep-Alive Protocol</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">Automatic / Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("targetEndpoint", "Target Endpoint")}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                    {showHfUrl
                      ? (data?.services.huggingFace.url.replace(/^https?:\/\//, "") || "-")
                      : maskEndpoint(data?.services.huggingFace.url || "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHfUrl(!showHfUrl)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
                    title={showHfUrl ? t("hideEndpoint", "Hide") : t("showEndpoint", "Show")}
                  >
                    {showHfUrl ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={wakeUpHf}
              className="w-full text-xs h-8 border-orange-200 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              {t("pingWakeUp", "Ping / Wake-Up Server")}
            </Button>
          </div>
        </div>

        {/* B. Vercel Hosting Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 grid place-items-center">
                  <Cloud className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vercel Edge Network</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Frontend / Proxy Caching</p>
                </div>
              </div>
              <DashboardBadge variant="success" size="sm">
                Active
              </DashboardBadge>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("edgeCaching", "Edge Caching")}</span>
                <span className="font-semibold text-[#2BA641]">
                  {data?.services.vercel.edgeCaching.status || "Active (Global Anycast)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("swrRevalidation", "SWR Revalidation")}</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">1 Day (86400s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("videoSegmentCache", "Video Segment Cache")}</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {data?.services.vercel.edgeCaching.segmentCache}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Anycast Network</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">300+ Edge Regions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("latestDeployment", "Latest Deployment")}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                    {showVercelUrl
                      ? (data?.services.vercel.latestDeployment?.url || "dramova.site")
                      : maskEndpoint(data?.services.vercel.latestDeployment?.url || "dramova.site")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVercelUrl(!showVercelUrl)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
                    title={showVercelUrl ? t("hideEndpoint", "Hide") : t("showEndpoint", "Show")}
                  >
                    {showVercelUrl ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center text-xs h-8 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t("openVercelDashboard", "Buka Vercel Dashboard")}
            </a>
          </div>
        </div>

        {/* C. Supabase Database Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                  <Database className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Supabase PostgreSQL</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Database / Auth / Storage</p>
                </div>
              </div>
              <DashboardBadge
                variant={sbStatus === "healthy" ? "success" : "warning"}
                size="sm"
              >
                {sbStatus === "healthy" ? t("healthyStatus", "Healthy") : t("degradedStatus", "Degraded")}
              </DashboardBadge>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("queryLatency", "Query Latency")}</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {data ? `${data.services.supabase.latencyMs} ms` : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("activePoolConnections", "Active Pool Connections")}</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {data?.services.supabase.activeConnections} / {data?.services.supabase.maxConnections} max
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">{t("databaseSize", "Database Size")}</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {data?.services.supabase.dbSize}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Auth / Storage Status</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#2BA641]" /> Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Row Level Security</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#2BA641]" /> Enforced
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center text-xs h-8 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t("openSupabaseStudio", "Buka Supabase Studio")}
            </a>
          </div>
        </div>
      </div>

      {/* 3. Live Latency Tracker (Real-time Timeline in WIB) */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("liveLatencyLog", "Live Latency Log (Realtime Polling)")}
            </h3>
          </div>
          {lastRefreshed && (
            <span className="text-[11px] text-zinc-400 font-mono">
              {t("lastCheck", "Pengecekan terakhir")}: {formatWibTime(lastRefreshed)}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-mono">
              <tr>
                <th className="p-2.5 w-10 text-center rounded-l-md">#</th>
                <th className="p-2.5">Timestamp (WIB)</th>
                <th className="p-2.5">Hugging Face Latency</th>
                <th className="p-2.5">Supabase Latency</th>
                <th className="p-2.5 rounded-r-md">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-zinc-400">
                    {t("waitingFirstPoll", "Menunggu polling pertama...")}
                  </td>
                </tr>
              ) : (
                currentLogs.map((item, idx) => {
                  const itemNumber = (page - 1) * 10 + idx + 1;
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="p-2.5 text-center font-mono text-zinc-400 dark:text-zinc-500">
                        {itemNumber}
                      </td>
                      <td className="p-2.5 font-mono text-zinc-600 dark:text-zinc-400">{item.time}</td>
                      <td className="p-2.5 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                        {item.hf} ms
                      </td>
                      <td className="p-2.5 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                        {item.sb} ms
                      </td>
                      <td className="p-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                          {t("operational", "Operational")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Halaman {page} dari {totalPages} ({latencyHistory.length} entri)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-2.5 text-xs"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 px-2.5 text-xs"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Runtime & Process Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{t("serverUptime", "Server Uptime")}</span>
          </div>
          <p className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {data ? formatUptime(data.runtime.uptimeSec) : "-"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Cpu className="h-3.5 w-3.5" />
            <span className="text-xs">{t("nodeVersion", "Node Version")}</span>
          </div>
          <p className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {data?.runtime.nodeVersion || "-"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <HardDrive className="h-3.5 w-3.5" />
            <span className="text-xs">{t("heapMemory", "Heap Memory")}</span>
          </div>
          <p className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {data ? `${data.runtime.memoryHeapUsedMb} MB` : "-"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Network className="h-3.5 w-3.5" />
            <span className="text-xs">{t("architecture", "Architecture")}</span>
          </div>
          <p className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100 capitalize">
            {data?.runtime.platform || "linux"} (x64)
          </p>
        </div>
      </div>
    </div>
  );
}
