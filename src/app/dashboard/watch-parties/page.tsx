"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  Tv,
  User as UserIcon,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Power
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardBadge,
  ShimmerBar,
} from "@/components/dashboard/DashboardComponents";

interface WatchPartyRoom {
  id: string;
  code: string;
  host_id: string;
  title: string;
  content_type: string;
  platform: string;
  content_id: string;
  content_title: string;
  current_episode: number;
  playback_state: {
    status: string;
    currentTime: number;
    episode: number;
  };
  max_participants: number;
  is_private: boolean;
  is_active: boolean;
  settings: {
    allowSeek?: boolean;
    allowPause?: boolean;
    allowNextEp?: boolean;
    chatEnabled?: boolean;
  };
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  host: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  participantCount: number;
}

export default function WatchPartiesManagementPage() {
  const { t } = useAdmin();
  const [rooms, setRooms] = useState<WatchPartyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedRoom, setSelectedRoom] = useState<WatchPartyRoom | null>(null);
  const [roomToDeactivate, setRoomToDeactivate] = useState<WatchPartyRoom | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  async function fetchRooms() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/watch-parties?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data Watch Party");
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {
      toast.error("Gagal memuat data Watch Party");
    } finally {
      setIsLoading(false);
    }
  }

  // Realtime refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, platformFilter, typeFilter]);

  async function handleDeactivateRoom() {
    if (!roomToDeactivate) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/watch-parties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deactivate",
          roomId: roomToDeactivate.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menutup room");

      toast.success(`Room #${roomToDeactivate.code} berhasil ditutup`);
      setRoomToDeactivate(null);
      fetchRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCleanupExpired() {
    try {
      setCleaningUp(true);
      const res = await fetch("/api/admin/watch-parties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membersihkan");

      toast.success(data.message || "Pembersihan selesai");
      fetchRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCleaningUp(false);
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode room #${code} berhasil disalin`);
  };

  function formatDate(iso: string | null) {
    if (!iso) return "-";
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
        title={t("watchParties", "Watch Party")}
        description="Monitoring sesi nonton bareng real-time, partisipan, dan kontrol room aktif."
        count={rooms.length}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRooms}
              disabled={isLoading}
              className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#3ecf8e]" : "text-zinc-600 dark:text-zinc-400"}`} />
              <span>{t("refresh", "Segarkan")}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCleanupExpired}
              disabled={cleaningUp}
              className="h-8 px-3 text-xs font-medium bg-[#3ecf8e] text-white hover:bg-[#24b47e] transition-colors cursor-pointer"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" />
              Cleanup Expired
            </Button>
          </div>
        }
      />

      {/* 2. Realtime Filters & Controls */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              placeholder="Cari kode room, judul konten, atau nama host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e] rounded-md w-full"
            />
          </div>

          <div className="grid grid-cols-2 md:col-span-2 gap-2">
            {/* Status Select */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="active" className="text-xs">Sedang Aktif</SelectItem>
                <SelectItem value="inactive" className="text-xs">Selesai</SelectItem>
              </SelectContent>
            </Select>

            {/* Platform Select */}
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="h-9 w-full text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
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
          </div>
        </div>
      </div>

      {/* 3. Rooms Table with Single Action Button Titik Tiga (...) */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-3 w-10 text-center">#</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Kode dan Judul Room</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Host</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Konten</TableHead>
                <TableHead className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Partisipan</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Playback</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Status</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Dibuat</TableHead>
                <TableHead className="text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-200 dark:border-zinc-800">
                    <TableCell className="py-3 px-3 text-center"><ShimmerBar className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <ShimmerBar className="h-4 w-12" />
                        <ShimmerBar className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ShimmerBar className="h-6 w-6 rounded-full" />
                        <ShimmerBar className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <ShimmerBar className="h-3.5 w-24" />
                        <ShimmerBar className="h-2.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center"><ShimmerBar className="h-5 w-10 mx-auto rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-14 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3 px-4 text-right"><ShimmerBar className="h-7 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : rooms.length === 0 ? (
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableCell colSpan={9} className="py-12">
                    <DashboardEmptyState
                      icon={<Tv className="h-8 w-8 mx-auto" />}
                      title="Room Nobar Kosong"
                      description="Tidak ada data Watch Party yang aktif atau sesuai dengan filter pencarian."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((r, index) => {
                  const state = r.playback_state;
                  return (
                    <TableRow key={r.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <TableCell className="py-3 px-3 text-center font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {index + 1}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-50">
                              #{r.code}
                            </span>
                            {r.is_private && (
                              <DashboardBadge variant="neutral" size="sm">Privat</DashboardBadge>
                            )}
                          </div>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[180px] mt-0.5" title={r.title}>
                            {r.title}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-zinc-200 dark:border-zinc-700">
                            {r.host.avatar_url ? (
                              <AvatarImage src={r.host.avatar_url} />
                            ) : null}
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              <UserIcon className="h-3.5 w-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[110px]" title={r.host.name}>
                            {r.host.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="truncate max-w-[180px]">
                          <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 block truncate" title={r.content_title || r.content_id}>
                            {r.content_title || r.content_id}
                          </span>
                          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase mt-0.5 font-mono">
                            {r.platform} · {r.content_type}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
                          {r.participantCount} / {r.max_participants}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                        Eps {state?.episode || r.current_episode} ({Math.floor((state?.currentTime || 0) / 60)}m)
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {r.is_active ? (
                          <DashboardBadge variant="success" size="sm" dot>
                            Live
                          </DashboardBadge>
                        ) : (
                          <DashboardBadge variant="neutral" size="sm">
                            Selesai
                          </DashboardBadge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDate(r.created_at)}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 p-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-md">
                            <DropdownMenuItem
                              onClick={() => setSelectedRoom(r)}
                              className="text-xs cursor-pointer py-1.5"
                            >
                              <Eye className="h-3.5 w-3.5 mr-2" /> Detail Konfigurasi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyCode(r.code)}
                              className="text-xs cursor-pointer py-1.5"
                            >
                              <Copy className="h-3.5 w-3.5 mr-2" /> Salin Kode Room
                            </DropdownMenuItem>

                            {r.is_active && (
                              <>
                                <DropdownMenuSeparator className="my-1 border-zinc-200 dark:border-zinc-800" />
                                <DropdownMenuItem
                                  onClick={() => setRoomToDeactivate(r)}
                                  className="text-xs text-[#ff2201] focus:text-[#ff2201] focus:bg-[#ff2201]/10 cursor-pointer py-1.5"
                                >
                                  <Power className="h-3.5 w-3.5 mr-2" /> Tutup Sesi Nobar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Room Detail Dialog */}
      <Dialog open={Boolean(selectedRoom)} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <DialogContent className="max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg p-5 sm:p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <span className="font-mono text-[#3ecf8e]">
                #{selectedRoom?.code}
              </span>
              <span className="truncate">{selectedRoom?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              Informasi konfigurasi dan status sinkronisasi room
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-semibold">Host</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">{selectedRoom.host.name}</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate font-mono mt-0.5">{selectedRoom.host.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-semibold">Status Room</span>
                  <div className="mt-1">
                    {selectedRoom.is_active ? (
                      <DashboardBadge variant="success" size="sm" dot>Sedang Aktif</DashboardBadge>
                    ) : (
                      <DashboardBadge variant="neutral" size="sm">Nonaktif</DashboardBadge>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 space-y-1 text-xs">
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-semibold">Konten Yang Diputar</span>
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                  {selectedRoom.content_title || selectedRoom.content_id}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Platform: <b className="text-zinc-900 dark:text-zinc-100 uppercase font-mono">{selectedRoom.platform}</b></span>
                  <span>Tipe: <b className="text-zinc-900 dark:text-zinc-100">{selectedRoom.content_type}</b></span>
                  <span>Episode: <b className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedRoom.current_episode}</b></span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 text-xs">
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-semibold">Pengaturan Sesi</span>
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  <div className="flex items-center justify-between bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Izinkan Pause:</span>
                    <b className="text-zinc-900 dark:text-zinc-100">{selectedRoom.settings.allowPause ? "Ya" : "Tidak"}</b>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Izinkan Seek:</span>
                    <b className="text-zinc-900 dark:text-zinc-100">{selectedRoom.settings.allowSeek ? "Ya" : "Tidak"}</b>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Ganti Eps:</span>
                    <b className="text-zinc-900 dark:text-zinc-100">{selectedRoom.settings.allowNextEp ? "Ya" : "Tidak"}</b>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Chat Room:</span>
                    <b className="text-zinc-900 dark:text-zinc-100">{selectedRoom.settings.chatEnabled ? "Aktif" : "Mati"}</b>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1.5">
                <span>Dibuat: {formatDate(selectedRoom.created_at)}</span>
                <span>Kedaluwarsa: {formatDate(selectedRoom.expires_at)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. Deactivate Alert Dialog */}
      <AlertDialog
        open={Boolean(roomToDeactivate)}
        onOpenChange={(open) => !open && setRoomToDeactivate(null)}
      >
        <AlertDialogContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-[#ff2201] mb-1.5">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold">Tutup Room Watch Party</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghentikan room <b className="text-zinc-900 dark:text-zinc-100">#{roomToDeactivate?.code} ({roomToDeactivate?.title})</b>? Seluruh partisipan di dalam room akan otomatis terputus dari sesi nobar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isSubmitting} className="text-xs h-8 border-zinc-200 dark:border-zinc-800">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivateRoom();
              }}
              disabled={isSubmitting}
              className="text-xs h-8 bg-[#ff2201] text-white hover:bg-[#d01c00]"
            >
              {isSubmitting ? "Menutup..." : "Tutup Room"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
