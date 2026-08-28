"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  ShieldAlert, 
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
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardBadge,
  ShimmerBar,
} from "@/components/dashboard/DashboardComponents";

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { t } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (actionFilter.trim()) params.set("action", actionFilter.trim());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
      if (isManualRefresh) {
        toast.success("Log audit berhasil disegarkan");
      }
    } catch {
      if (isManualRefresh) {
        toast.error("Gagal memuat audit log Superuser");
      }
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter]);

  // Realtime search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "-";
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title={t("auditLogs", "Log Audit Security")}
        description="Rekam jejak dan audit trail seluruh tindakan administratif yang dilakukan akun Superuser."
        count={logs.length}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={isLoading}
            className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#3ecf8e]" : "text-zinc-600 dark:text-zinc-400"}`} />
            <span>{t("refresh", "Segarkan")}</span>
          </Button>
        }
      />

      {/* 2. Realtime Filter Bar (Tanpa Tombol Filter) */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Filter nama aksi (cth: ban_user, update_role, deactivate_room) secara realtime..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e] rounded-md"
          />
        </div>
      </div>

      {/* 3. Audit Logs Table with Column '#' */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-3 w-10 text-center">#</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Aktor (Superuser)</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Aksi</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Entitas Target</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Metadata / Rincian</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-200 dark:border-zinc-800">
                    <TableCell className="py-3 px-3 text-center"><ShimmerBar className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <ShimmerBar className="h-3.5 w-24" />
                        <ShimmerBar className="h-2.5 w-36" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-10 w-48 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableCell colSpan={6} className="py-12">
                    <DashboardEmptyState
                      icon={<ShieldAlert className="h-8 w-8 mx-auto" />}
                      title="Log Audit Kosong"
                      description="Belum ada catatan log aktivitas administratif Superuser di sistem."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow key={log.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="py-3 px-3 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {index + 1}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <div>
                        <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                          {log.actor.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          {log.actor.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <DashboardBadge
                        variant={
                          log.action.includes("ban")
                            ? "danger"
                            : log.action.includes("promote")
                            ? "success"
                            : log.action.includes("deactivate")
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {log.action}
                      </DashboardBadge>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-xs">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                        {log.entity_type}
                      </span>
                      {log.entity_id && (
                        <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[130px] mt-0.5">
                          ID: {log.entity_id}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <pre className="max-w-[260px] overflow-x-auto rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 p-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 1)}
                      </pre>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono tabular-nums">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
