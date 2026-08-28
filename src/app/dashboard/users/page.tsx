"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, 
  Search, 
  RefreshCw, 
  MoreVertical, 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  CheckCircle, 
  AlertTriangle,
  User as UserIcon,
  Plus,
  Edit,
  Trash2,
  Eye
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
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/context/AdminContext";
import {
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardBadge,
  ShimmerBar,
} from "@/components/dashboard/DashboardComponents";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
  watchCount: number;
  roomCount: number;
}

interface UserDetailData {
  profile: AdminUser;
  watchHistory: Array<{
    id: number;
    content_type: string;
    platform: string;
    content_id: string;
    title: string | null;
    episode: number;
    position_seconds: number;
    duration_seconds: number;
    completed: boolean;
    last_watched_at: string;
  }>;
  activities: Array<{
    id: number;
    activity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  hostedRooms: Array<{
    id: string;
    code: string;
    title: string;
    content_type: string;
    platform: string;
    content_title: string;
    is_active: boolean;
    created_at: string;
  }>;
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const { t } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail Modal State
  const [detailUser, setDetailUser] = useState<UserDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [isCreating, setIsCreating] = useState(false);

  // Edit User Modal State
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "user" });
  const [isEditing, setIsEditing] = useState(false);

  // Action Confirmation State
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<"promote" | "demote" | "ban" | "unban" | "delete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async (isManualRefresh = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data pengguna");
      const data = await res.json();
      setUsers(data.users || []);
      if (isManualRefresh) {
        toast.success("Data pengguna berhasil disegarkan");
      }
    } catch {
      if (isManualRefresh) {
        toast.error("Gagal memuat data pengguna");
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // Realtime search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  async function openDetail(userId: string) {
    try {
      setIsDetailOpen(true);
      setLoadingDetail(true);
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Gagal memuat detail pengguna");
      const data = await res.json();
      setDetailUser(data);
    } catch {
      toast.error("Gagal membuka detail user");
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      return toast.error("Semua kolom pendaftaran wajib diisi");
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna");

      toast.success(data.message || "Pengguna berhasil dibuat");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
      fetchUsers(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setIsEditing(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: editUser.id,
          name: editForm.name,
          role: editForm.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Data pengguna berhasil diperbarui");
      setEditUser(null);
      fetchUsers(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  async function executeAction() {
    if (!actionUser || !actionType) return;
    try {
      setIsSubmitting(true);

      if (actionType === "delete") {
        const res = await fetch(`/api/admin/users?id=${actionUser.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`Pengguna ${actionUser.name} berhasil dihapus permanen`);
      } else {
        let payload: Record<string, unknown> = { targetUserId: actionUser.id };
        if (actionType === "promote") payload.role = "superuser";
        else if (actionType === "demote") payload.role = "user";
        else if (actionType === "ban") payload.isBanned = true;
        else if (actionType === "unban") payload.isBanned = false;

        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast.success(
          actionType === "promote"
            ? `Akun ${actionUser.name} dijadikan Super User`
            : actionType === "demote"
            ? `Role ${actionUser.name} diubah ke Pengguna`
            : actionType === "ban"
            ? `Pengguna ${actionUser.name} telah diblokir`
            : `Blokir pengguna ${actionUser.name} telah dibuka`
        );
      }

      setActionUser(null);
      setActionType(null);
      fetchUsers(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return "-";
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header */}
      <DashboardPageHeader
        title={t("users", "Manajemen Pengguna")}
        description="Kelola akun pengguna, hak akses Super User, serta status blokir akun di Dramova."
        count={users.length}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={isLoading}
              className="h-8 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#2BA641]" : "text-zinc-600 dark:text-zinc-400"}`} />
              <span>{t("refresh", "Segarkan")}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3 text-xs font-medium bg-[#2BA641] text-white hover:bg-[#238A36] transition-colors cursor-pointer shadow-none"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-white" />
              <span>{t("createUser", "Tambah Pengguna")}</span>
            </Button>
          </div>
        }
      />

      {/* 2. Realtime Search and Filter Bar */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              placeholder="Cari nama atau email pengguna secara realtime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 focus-visible:ring-[#2BA641]/40 focus-visible:border-[#2BA641] rounded-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#2BA641]/40 focus:border-[#2BA641]">
                <SelectValue placeholder="Peran" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                <SelectItem value="all" className="text-xs">Semua Peran</SelectItem>
                <SelectItem value="superuser" className="text-xs">Super User</SelectItem>
                <SelectItem value="user" className="text-xs">Pengguna</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#2BA641]/40 focus:border-[#2BA641]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="active" className="text-xs">Aktif Normal</SelectItem>
                <SelectItem value="banned" className="text-xs">Terblokir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Table of Users with Single Action Button Titik Tiga (...) */}
      <div className="rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-3 w-10 text-center">#</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Pengguna</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Peran</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Status</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Riwayat</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Room</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Terdaftar</TableHead>
                <TableHead className="text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-3 px-4">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-200 dark:border-zinc-800">
                    <TableCell className="py-3 px-3 text-center"><ShimmerBar className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <ShimmerBar className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <ShimmerBar className="h-3.5 w-28" />
                          <ShimmerBar className="h-2.5 w-36" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-16 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-5 w-14 rounded-md" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-12" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-12" /></TableCell>
                    <TableCell className="py-3 px-4"><ShimmerBar className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3 px-4 text-right"><ShimmerBar className="h-7 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableCell colSpan={8} className="py-12">
                    <DashboardEmptyState
                      icon={<Users className="h-8 w-8 mx-auto" />}
                      title="Pengguna Tidak Ditemukan"
                      description="Tidak ada data akun yang cocok dengan kata kunci atau filter yang dipilih."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, index) => (
                  <TableRow key={u.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="py-3 px-3 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            <UserIcon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{u.name || "Anonim"}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <DashboardBadge
                        variant={u.role === "superuser" ? "success" : "neutral"}
                        size="sm"
                      >
                        {u.role === "superuser" ? "Super User" : "Pengguna"}
                      </DashboardBadge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {u.is_banned ? (
                        <DashboardBadge variant="danger" size="sm" dot>
                          Terblokir
                        </DashboardBadge>
                      ) : (
                        <DashboardBadge variant="success" size="sm" dot>
                          Aktif
                        </DashboardBadge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                      {u.watchCount} film
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                      {u.roomCount} room
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-md">
                          <DropdownMenuItem
                            onClick={() => openDetail(u.id)}
                            className="text-xs cursor-pointer py-1.5"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2" /> Detail Profil dan Log
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditUser(u);
                              setEditForm({ name: u.name, role: u.role });
                            }}
                            className="text-xs cursor-pointer py-1.5"
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" /> Edit Informasi
                          </DropdownMenuItem>

                          {currentUser?.id !== u.id && (
                            <>
                              <DropdownMenuSeparator className="my-1 border-zinc-200 dark:border-zinc-800" />
                              {u.role !== "superuser" ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("promote");
                                  }}
                                  className="text-xs cursor-pointer py-1.5"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-2 text-[#2BA641]" />
                                  Jadikan Super User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("demote");
                                  }}
                                  className="text-xs cursor-pointer py-1.5"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  Ubah ke Pengguna
                                </DropdownMenuItem>
                              )}
                              
                              {!u.is_banned ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("ban");
                                  }}
                                  className="text-xs text-[#ff2201] focus:text-[#ff2201] focus:bg-[#ff2201]/10 cursor-pointer py-1.5"
                                >
                                  <Ban className="h-3.5 w-3.5 mr-2" />
                                  Blokir Pengguna
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionUser(u);
                                    setActionType("unban");
                                  }}
                                  className="text-xs text-[#2BA641] focus:text-[#2BA641] focus:bg-[#2BA641]/10 cursor-pointer py-1.5"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                  Buka Blokir
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator className="my-1 border-zinc-200 dark:border-zinc-800" />
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionUser(u);
                                  setActionType("delete");
                                }}
                                className="text-xs text-[#ff2201] focus:text-[#ff2201] focus:bg-[#ff2201]/10 cursor-pointer py-1.5"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                {t("deleteUser", "Hapus Pengguna Permanen")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg p-5 sm:p-6 shadow-2xl font-sans">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {t("createUser", "Tambah Pengguna")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Masukkan nama..."
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Alamat Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="masukkan email..."
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password Awal</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Peran Akun</label>
              <Select
                value={createForm.role}
                onValueChange={(val) => setCreateForm({ ...createForm, role: val })}
              >
                <SelectTrigger className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                  <SelectItem value="user" className="text-xs">Pengguna</SelectItem>
                  <SelectItem value="superuser" className="text-xs">Super User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs h-8 border-zinc-200 dark:border-zinc-800">
                Batal
              </Button>
              <Button type="submit" disabled={isCreating} size="sm" className="text-xs h-8 bg-[#2BA641] text-white hover:bg-[#238A36]">
                {isCreating ? "Menambahkan..." : "Tambah Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Edit User Dialog */}
      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg p-5 sm:p-6 shadow-2xl font-sans">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {t("editUser", "Edit Data Pengguna")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus-visible:ring-1 focus-visible:ring-[#3ecf8e]/40 focus-visible:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Peran Akun</label>
              <Select
                value={editForm.role}
                onValueChange={(val) => setEditForm({ ...editForm, role: val })}
              >
                <SelectTrigger className="h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] focus:ring-1 focus:ring-[#3ecf8e]/40 focus:border-[#3ecf8e]">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
                  <SelectItem value="user" className="text-xs">Pengguna</SelectItem>
                  <SelectItem value="superuser" className="text-xs">Super User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditUser(null)} className="text-xs h-8 border-zinc-200 dark:border-zinc-800">
                Batal
              </Button>
              <Button type="submit" disabled={isEditing} size="sm" className="text-xs h-8 bg-[#2BA641] text-white hover:bg-[#238A36]">
                {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. User Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg p-5 sm:p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Detail Profil dan Aktivitas
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              Data tontonan, room nobar, dan event log Supabase pengguna
            </DialogDescription>
          </DialogHeader>

          {loadingDetail || !detailUser ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
                <ShimmerBar className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <ShimmerBar className="h-4 w-32" />
                  <ShimmerBar className="h-3 w-48" />
                </div>
              </div>
              <ShimmerBar className="h-48 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="flex items-center gap-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4">
                <Avatar className="h-12 w-12 border border-zinc-200 dark:border-zinc-700">
                  {detailUser.profile.avatar_url ? (
                    <AvatarImage src={detailUser.profile.avatar_url} />
                  ) : null}
                  <AvatarFallback className="text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {detailUser.profile.name}
                    </h3>
                    <DashboardBadge
                      variant={detailUser.profile.role === "superuser" ? "success" : "neutral"}
                      size="sm"
                    >
                      {detailUser.profile.role === "superuser" ? "Super User" : "Pengguna"}
                    </DashboardBadge>
                    {detailUser.profile.is_banned && (
                      <DashboardBadge variant="danger" size="sm" dot>
                        Diblokir
                      </DashboardBadge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono mt-0.5">
                    {detailUser.profile.email}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                    ID: {detailUser.profile.id}
                  </p>
                </div>
              </div>

              {/* Tabs for Relations */}
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-md p-0.5">
                  <TabsTrigger value="history" className="text-xs py-1.5 rounded-sm">
                    Riwayat ({detailUser.watchHistory.length})
                  </TabsTrigger>
                  <TabsTrigger value="rooms" className="text-xs py-1.5 rounded-sm">
                    Room Nobar ({detailUser.hostedRooms.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs py-1.5 rounded-sm">
                    Log ({detailUser.activities.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Watch History */}
                <TabsContent value="history" className="space-y-2 mt-3">
                  {detailUser.watchHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Belum ada riwayat tontonan
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                      {detailUser.watchHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between pt-2 text-xs"
                        >
                          <div className="overflow-hidden pr-3">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {item.title || item.content_id}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {item.platform} · {item.content_type} · Eps {item.episode}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.completed ? (
                              <DashboardBadge variant="success" size="sm">
                                Selesai
                              </DashboardBadge>
                            ) : (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                                {Math.floor(item.position_seconds / 60)}m / {Math.floor(item.duration_seconds / 60)}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Hosted Rooms */}
                <TabsContent value="rooms" className="space-y-2 mt-3">
                  {detailUser.hostedRooms.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Belum pernah membuat Room Nobar
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                      {detailUser.hostedRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between pt-2 text-xs"
                        >
                          <div className="overflow-hidden pr-3">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {room.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {room.content_title || room.content_type} · Kode #{room.code}
                            </p>
                          </div>
                          <DashboardBadge
                            variant={room.is_active ? "success" : "neutral"}
                            size="sm"
                            dot={room.is_active}
                          >
                            {room.is_active ? "Live" : "Selesai"}
                          </DashboardBadge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Event Logs */}
                <TabsContent value="activity" className="space-y-2 mt-3">
                  {detailUser.activities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Belum ada event log aktivitas
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                      {detailUser.activities.map((act) => (
                        <div key={act.id} className="pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {act.activity_type}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {formatDate(act.created_at)}
                            </span>
                          </div>
                          <pre className="mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-[10px] font-mono overflow-x-auto text-zinc-600 dark:text-zinc-400">
                            {JSON.stringify(act.metadata, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Action Alert Confirmation */}
      <AlertDialog
        open={Boolean(actionUser && actionType)}
        onOpenChange={(open) => {
          if (!open) {
            setActionUser(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Konfirmasi Tindakan Pengguna
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              {actionType === "promote" &&
                `Apakah Anda yakin ingin menaikkan hak akses ${actionUser?.name} (${actionUser?.email}) menjadi Super User?`}
              {actionType === "demote" &&
                `Apakah Anda yakin ingin mengubah peran ${actionUser?.name} (${actionUser?.email}) menjadi Pengguna biasa?`}
              {actionType === "ban" &&
                `Apakah Anda yakin ingin memblokir akses ${actionUser?.name} (${actionUser?.email}) dari aplikasi?`}
              {actionType === "unban" &&
                `Apakah Anda yakin ingin membuka blokir akun ${actionUser?.name} (${actionUser?.email})?`}
              {actionType === "delete" &&
                `Apakah Anda yakin ingin menghapus akun ${actionUser?.name} (${actionUser?.email}) secara permanen dari database? Seluruh data tontonan dan room akan dihapus.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="text-xs h-8 border-zinc-200 dark:border-zinc-800"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeAction();
              }}
              disabled={isSubmitting}
              className={`text-xs h-8 ${
                actionType === "ban" || actionType === "delete"
                  ? "bg-[#ff2201] text-white hover:bg-[#d01c00]"
                  : "bg-[#2BA641] text-white hover:bg-[#238A36]"
              }`}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
