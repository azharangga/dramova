import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = "shorts" | "series" | "movie";
export type ParticipantRole = "host" | "moderator" | "viewer";
export type ParticipantStatus = "active" | "paused" | "buffering" | "disconnected";

export interface RoomSettings {
  allowSeek: boolean;
  allowPause: boolean;
  allowNextEp: boolean;
  chatEnabled: boolean;
}

export interface PlaybackState {
  status: "playing" | "paused" | "buffering";
  currentTime: number;
  episode: number;
  playbackRate?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WatchRoom {
  id: string;
  code: string;
  host_id: string;
  title: string;
  content_type: ContentType;
  platform: string;
  content_id: string;
  content_title: string;
  current_episode: number;
  playback_state: PlaybackState;
  max_participants: number;
  is_private: boolean;
  is_active: boolean;
  settings: RoomSettings;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: ParticipantRole;
  status: ParticipantStatus;
  last_heartbeat_at: string;
  joined_at: string;
}

export interface RoomInvitation {
  id: string;
  room_id: string;
  invited_by: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateRoomPayload {
  title: string;
  content_type: ContentType;
  platform: string;
  content_id: string;
  content_title: string;
  current_episode?: number;
  max_participants?: number;
  is_private?: boolean;
  settings?: Partial<RoomSettings>;
  expires_in_hours?: number;
}

export interface JoinRoomPayload {
  invite_code?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function defaultSettings(): RoomSettings {
  return {
    allowSeek: true,
    allowPause: true,
    allowNextEp: true,
    chatEnabled: true,
  };
}

/** Check if a room has expired based on expires_at */
function isRoomExpired(room: { is_active: boolean; expires_at: string | null }): boolean {
  if (!room.is_active) return true;
  if (!room.expires_at) return false; // null = unlimited
  return new Date(room.expires_at) < new Date();
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Create a new watch room.
 * Returns the created room with participant record for the host.
 */
export async function createRoom(
  supabase: SupabaseClient,
  userId: string,
  userData: { name: string; avatar_url?: string | null },
  payload: CreateRoomPayload
): Promise<{ room: WatchRoom | null; error?: string }> {
  // expires_in_hours: -1 or null means unlimited (no expiry), 0/undefined defaults to 24h
  const expires_at = payload.expires_in_hours === -1 || payload.expires_in_hours === null
    ? null
    : payload.expires_in_hours
      ? new Date(Date.now() + payload.expires_in_hours * 3600000).toISOString()
      : new Date(Date.now() + 24 * 3600000).toISOString();

  const settings = { ...defaultSettings(), ...(payload.settings || {}) };

  const { data: room, error } = await supabase
    .from("watch_rooms")
    .insert({
      host_id: userId,
      title: payload.title.slice(0, 120),
      content_type: payload.content_type,
      platform: payload.platform.slice(0, 60),
      content_id: payload.content_id.slice(0, 300),
      content_title: (payload.content_title || "").slice(0, 300),
      current_episode: payload.current_episode || 1,
      max_participants: Math.min(Math.max(payload.max_participants || 5, 2), 5),
      is_private: payload.is_private ?? false,
      settings,
      expires_at,
      playback_state: {
        status: "paused",
        currentTime: 0,
        episode: payload.current_episode || 1,
      },
    })
    .select()
    .single();

  if (error || !room) {
    return { room: null, error: error?.message || "Gagal membuat room" };
  }

  // Insert host as first participant
  await supabase.from("watch_room_participants").insert({
    room_id: room.id,
    user_id: userId,
    display_name: userData.name,
    avatar_url: userData.avatar_url || null,
    role: "host",
    status: "active",
  });

  // Log activity
  await supabase.from("watch_room_activity_log").insert({
    room_id: room.id,
    user_id: userId,
    action: "room_created",
    metadata: { title: payload.title },
  });

  return { room: room as WatchRoom };
}

/**
 * Join an existing room.
 */
export async function joinRoom(
  supabase: SupabaseClient,
  userId: string,
  userData: { name: string; avatar_url?: string | null },
  roomId: string,
  inviteCode?: string
): Promise<{ participant: RoomParticipant | null; room: WatchRoom | null; error?: string }> {
  // Fetch room
  const { data: room, error: roomErr } = await supabase
    .from("watch_rooms")
    .select("*")
    .eq("id", roomId)
    .eq("is_active", true)
    .single();

  if (roomErr || !room) {
    return { participant: null, room: null, error: "Room tidak ditemukan atau sudah ditutup" };
  }

  // Check if room has expired
  if (isRoomExpired(room)) {
    // Auto-close expired room
    await supabase.from("watch_rooms").update({ is_active: false }).eq("id", roomId);
    await supabase.from("watch_room_participants").delete().eq("room_id", roomId);
    return { participant: null, room: null, error: "Room sudah kedaluwarsa dan ditutup secara otomatis" };
  }

  // Check participant count
  const { count } = await supabase
    .from("watch_room_participants")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId);

  if ((count || 0) >= room.max_participants) {
    return { participant: null, room: null, error: "Room sudah penuh" };
  }

  // If private room, validate invite code (or allow room code as fallback)
  if (room.is_private && inviteCode) {
    const normalizedCode = inviteCode.toUpperCase();
    const { data: invite, error: invErr } = await supabase
      .from("watch_room_invitations")
      .select("*")
      .eq("room_id", roomId)
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .single();

    if (invErr || !invite) {
      // Fallback: check if the code matches the room code directly
      if (normalizedCode !== room.code) {
        return { participant: null, room: null, error: "Kode undangan tidak valid" };
      }
    } else {
      // Check usage limit
      if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
        return { participant: null, room: null, error: "Kode undangan sudah habis digunakan" };
      }

      // Check expiry
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return { participant: null, room: null, error: "Kode undangan sudah kedaluwarsa" };
      }

      // Increment usage
      await supabase
        .from("watch_room_invitations")
        .update({ used_count: invite.used_count + 1 })
        .eq("id", invite.id);
    }
  }

  // Check if already a participant
  const { data: existing } = await supabase
    .from("watch_room_participants")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Reactivate if disconnected
    const { data: reactivated } = await supabase
      .from("watch_room_participants")
      .update({ status: "active", last_heartbeat_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    return { participant: reactivated as RoomParticipant, room: room as WatchRoom };
  }

  // Insert new participant (restore host role if user is room creator)
  const isHost = room.host_id === userId;
  const { data: participant, error: partErr } = await supabase
    .from("watch_room_participants")
    .insert({
      room_id: roomId,
      user_id: userId,
      display_name: userData.name,
      avatar_url: userData.avatar_url || null,
      role: isHost ? "host" : "viewer",
      status: "active",
    })
    .select()
    .single();

  if (partErr || !participant) {
    return { participant: null, room: null, error: partErr?.message || "Gagal bergabung ke room" };
  }

  // Log activity
  await supabase.from("watch_room_activity_log").insert({
    room_id: roomId,
    user_id: userId,
    action: "join",
    metadata: { name: userData.name },
  });

  return { participant: participant as RoomParticipant, room: room as WatchRoom };
}

/**
 * Leave a room (soft delete participant).
 */
export async function leaveRoom(
  supabase: SupabaseClient,
  userId: string,
  roomId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("watch_room_participants")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await supabase.from("watch_room_activity_log").insert({
    room_id: roomId,
    user_id: userId,
    action: "leave",
    metadata: {},
  });

  return {};
}

/**
 * Get room details with participants.
 */
export async function getRoomState(
  supabase: SupabaseClient,
  roomId: string
): Promise<{ room: WatchRoom | null; participants: RoomParticipant[]; error?: string }> {
  const { data: room, error } = await supabase
    .from("watch_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error || !room) {
    return { room: null, participants: [], error: "Room tidak ditemukan" };
  }

  // Auto-close if expired
  if (isRoomExpired(room)) {
    await supabase.from("watch_rooms").update({ is_active: false }).eq("id", roomId);
    await supabase.from("watch_room_participants").delete().eq("room_id", roomId);
    return { room: { ...room, is_active: false } as WatchRoom, participants: [], error: "Room sudah kedaluwarsa" };
  }

  const { data: participants } = await supabase
    .from("watch_room_participants")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  const allParticipants = (participants || []) as RoomParticipant[];

  // Clean up stale participants (heartbeat older than 30s = disconnected)
  const now = Date.now();
  const staleThreshold = 30000; // 30 seconds without heartbeat
  const staleIds: string[] = [];
  const activeParticipants: RoomParticipant[] = [];

  for (const p of allParticipants) {
    const lastBeat = new Date(p.last_heartbeat_at).getTime();
    if (now - lastBeat > staleThreshold) {
      staleIds.push(p.id);
    } else {
      activeParticipants.push(p);
    }
  }

  // Remove stale participants in background (don't block response)
  if (staleIds.length > 0) {
    supabase
      .from("watch_room_participants")
      .delete()
      .in("id", staleIds)
      .then(() => {
        // Log leave activity for each stale participant
        for (const staleId of staleIds) {
          const stale = allParticipants.find(p => p.id === staleId);
          if (stale) {
            supabase.from("watch_room_activity_log").insert({
              room_id: roomId,
              user_id: stale.user_id,
              action: "leave",
              metadata: { reason: "heartbeat_timeout" },
            });
          }
        }
      });
  }

  return {
    room: room as WatchRoom,
    participants: activeParticipants,
  };
}

/**
 * Update playback state (host only).
 */
export async function updatePlaybackState(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  state: Partial<PlaybackState>
): Promise<{ error?: string }> {
  // Verify host
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("host_id, playback_state")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== userId) {
    return { error: "Hanya host yang dapat mengubah playback" };
  }

  const newState = { ...(room.playback_state as PlaybackState), ...state, updatedAt: new Date().toISOString(), updatedBy: userId };

  const { error } = await supabase
    .from("watch_rooms")
    .update({ playback_state: newState, current_episode: state.episode || room.playback_state?.episode })
    .eq("id", roomId);

  return error ? { error: error.message } : {};
}

/**
 * Update room settings (host only).
 */
export async function updateRoomSettings(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  settings: Partial<RoomSettings>
): Promise<{ error?: string }> {
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("host_id, settings")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== userId) {
    return { error: "Hanya host yang dapat mengubah pengaturan" };
  }

  const newSettings = { ...(room.settings as RoomSettings), ...settings };

  const { error } = await supabase
    .from("watch_rooms")
    .update({ settings: newSettings })
    .eq("id", roomId);

  return error ? { error: error.message } : {};
}

/**
 * Kick a participant (host/moderator only).
 */
export async function kickParticipant(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  targetUserId: string
): Promise<{ error?: string }> {
  // Verify kicker is host or moderator
  const { data: kicker } = await supabase
    .from("watch_room_participants")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  if (!kicker || !["host", "moderator"].includes(kicker.role)) {
    // Also check if user is room host directly
    const { data: room } = await supabase
      .from("watch_rooms")
      .select("host_id")
      .eq("id", roomId)
      .single();
    if (!room || room.host_id !== userId) {
      return { error: "Tidak memiliki izin untuk kick peserta" };
    }
  }

  // Cannot kick yourself (use leave instead)
  if (targetUserId === userId) {
    return { error: "Gunakan leave untuk keluar dari room" };
  }

  const { error } = await supabase
    .from("watch_room_participants")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await supabase.from("watch_room_activity_log").insert({
    room_id: roomId,
    user_id: userId,
    action: "kick",
    metadata: { targetUserId },
  });

  return {};
}

/**
 * Close/delete room (host only).
 */
export async function closeRoom(
  supabase: SupabaseClient,
  userId: string,
  roomId: string
): Promise<{ error?: string }> {
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== userId) {
    return { error: "Hanya host yang dapat menutup room" };
  }

  const { error } = await supabase
    .from("watch_rooms")
    .update({ is_active: false })
    .eq("id", roomId);

  if (error) return { error: error.message };

  // Remove all participants
  await supabase.from("watch_room_participants").delete().eq("room_id", roomId);

  // Log activity
  await supabase.from("watch_room_activity_log").insert({
    room_id: roomId,
    user_id: userId,
    action: "room_closed",
    metadata: {},
  });

  return {};
}

/** Generate a 6-char uppercase alphanumeric code */
function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create an invite code for a room.
 * Generates a 6-char uppercase code that expires in `expiresInMinutes` (default 5).
 */
export async function createInvite(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  maxUses = 0,
  expiresInMinutes = 5
): Promise<{ code: string | null; error?: string }> {
  // Verify host
  const { data: room } = await supabase
    .from("watch_rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();

  if (!room || room.host_id !== userId) {
    return { code: null, error: "Hanya host yang dapat membuat undangan" };
  }

  const expires_at = new Date(Date.now() + expiresInMinutes * 60000).toISOString();

  // Generate unique 6-char uppercase code
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateCode(6);
    const { data: existing } = await supabase
      .from("watch_room_invitations")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
  }

  const { data, error } = await supabase
    .from("watch_room_invitations")
    .insert({
      room_id: roomId,
      invited_by: userId,
      code,
      max_uses: maxUses,
      expires_at,
    })
    .select("code")
    .single();

  if (error || !data) {
    return { code: null, error: error?.message || "Gagal membuat kode undangan" };
  }

  return { code: data.code };
}

/**
 * Validate and resolve an invite code.
 */
export async function resolveInviteCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ roomId: string | null; error?: string }> {
  const normalizedCode = code.toUpperCase();
  const { data, error } = await supabase
    .from("watch_room_invitations")
    .select("room_id, max_uses, used_count, expires_at, is_active")
    .eq("code", normalizedCode)
    .single();

  if (error || !data) {
    return { roomId: null, error: "Kode undangan tidak valid" };
  }

  if (!data.is_active) {
    return { roomId: null, error: "Kode undangan sudah tidak aktif" };
  }

  if (data.max_uses > 0 && data.used_count >= data.max_uses) {
    return { roomId: null, error: "Kode undangan sudah habis digunakan" };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { roomId: null, error: "Kode undangan sudah kedaluwarsa" };
  }

  return { roomId: data.room_id };
}

/**
 * Resolve a room code (6-char) to room ID.
 */
export async function resolveRoomCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ roomId: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("id, is_active")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !data) {
    return { roomId: null, error: "Kode room tidak ditemukan" };
  }

  if (!data.is_active) {
    return { roomId: null, error: "Room sudah ditutup" };
  }

  return { roomId: data.id };
}

/**
 * List rooms where user is a participant (active rooms).
 */
export async function listUserRooms(
  supabase: SupabaseClient,
  userId: string
): Promise<WatchRoom[]> {
  // Get rooms where user is a current participant
  const { data: participantRooms } = await supabase
    .from("watch_room_participants")
    .select("room_id")
    .eq("user_id", userId);

  const participantRoomIds = (participantRooms || []).map((p) => p.room_id);

  // Get rooms where user is host (even if they left as participant)
  const { data: hostedRooms } = await supabase
    .from("watch_rooms")
    .select("id")
    .eq("host_id", userId)
    .eq("is_active", true);

  const hostedRoomIds = (hostedRooms || []).map((r) => r.id);

  // Combine and deduplicate
  const allRoomIds = [...new Set([...participantRoomIds, ...hostedRoomIds])];

  if (allRoomIds.length === 0) return [];

  const { data: rooms } = await supabase
    .from("watch_rooms")
    .select("*")
    .in("id", allRoomIds)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Filter out expired rooms and auto-close them
  const now = new Date();
  const activeRooms: WatchRoom[] = [];
  const expiredIds: string[] = [];

  for (const room of rooms || []) {
    if (room.expires_at && new Date(room.expires_at) < now) {
      expiredIds.push(room.id);
    } else {
      activeRooms.push(room as WatchRoom);
    }
  }

  // Auto-close expired rooms in background (don't await)
  if (expiredIds.length > 0) {
    supabase
      .from("watch_rooms")
      .update({ is_active: false })
      .in("id", expiredIds)
      .then(() => {
        for (const id of expiredIds) {
          supabase.from("watch_room_participants").delete().eq("room_id", id);
        }
      });
  }

  return activeRooms;
}

/**
 * Log an activity event.
 */
export async function logActivity(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from("watch_room_activity_log").insert({
    room_id: roomId,
    user_id: userId,
    action,
    metadata,
  });
}

/**
 * Cleanup expired rooms: deactivate and remove participants.
 * Called by cron job or can be triggered manually.
 */
export async function cleanupExpiredRooms(
  supabase: SupabaseClient
): Promise<{ cleaned: number; error?: string }> {
  const now = new Date().toISOString();

  // Find all active rooms that have passed their expires_at
  const { data: expiredRooms, error: fetchErr } = await supabase
    .from("watch_rooms")
    .select("id")
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (fetchErr) {
    return { cleaned: 0, error: fetchErr.message };
  }

  if (!expiredRooms || expiredRooms.length === 0) {
    return { cleaned: 0 };
  }

  const expiredIds = expiredRooms.map((r) => r.id);

  // Deactivate rooms
  const { error: updateErr } = await supabase
    .from("watch_rooms")
    .update({ is_active: false })
    .in("id", expiredIds);

  if (updateErr) {
    return { cleaned: 0, error: updateErr.message };
  }

  // Remove participants from expired rooms
  await supabase.from("watch_room_participants").delete().in("room_id", expiredIds);

  return { cleaned: expiredIds.length };
}
