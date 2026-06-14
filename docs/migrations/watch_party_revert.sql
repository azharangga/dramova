-- ============================================================================
-- DRAMOVA WATCH PARTY (NONTON BARENG)
-- REVERT / ROLLBACK Migration
--
-- PERINGATAN: Script ini akan menghapus SEMUA data dan objek database
-- yang terkait fitur Watch Party. Gunakan hanya jika Anda yakin ingin
-- menghapus fitur ini sepenuhnya.
--
-- Cara pakai: Jalankan di Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Hapus Realtime Publication
-- ============================================================================

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS watch_room_participants;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS watch_rooms;

-- ============================================================================
-- 2. Hapus View
-- ============================================================================

DROP VIEW IF EXISTS watch_rooms_active;

-- ============================================================================
-- 3. Hapus Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trg_watch_rooms_updated_at ON watch_rooms;

-- ============================================================================
-- 4. Hapus RLS Policies
-- ============================================================================

-- watch_rooms
DROP POLICY IF EXISTS "read_rooms" ON watch_rooms;
DROP POLICY IF EXISTS "create_rooms" ON watch_rooms;
DROP POLICY IF EXISTS "update_rooms" ON watch_rooms;
DROP POLICY IF EXISTS "delete_rooms" ON watch_rooms;

-- watch_room_participants
DROP POLICY IF EXISTS "read_participants" ON watch_room_participants;
DROP POLICY IF EXISTS "join_participants" ON watch_room_participants;
DROP POLICY IF EXISTS "update_own_participant" ON watch_room_participants;
DROP POLICY IF EXISTS "delete_participants" ON watch_room_participants;

-- watch_room_invitations
DROP POLICY IF EXISTS "read_invitations" ON watch_room_invitations;
DROP POLICY IF EXISTS "create_invitations" ON watch_room_invitations;
DROP POLICY IF EXISTS "update_invitations" ON watch_room_invitations;

-- watch_room_activity_log
DROP POLICY IF EXISTS "read_activity" ON watch_room_activity_log;
DROP POLICY IF EXISTS "insert_activity" ON watch_room_activity_log;

-- ============================================================================
-- 5. Cabut Grants
-- ============================================================================

REVOKE ALL ON watch_room_activity_log FROM authenticated;
REVOKE ALL ON watch_room_invitations FROM authenticated;
REVOKE ALL ON watch_room_participants FROM authenticated;
REVOKE ALL ON watch_rooms FROM authenticated;

-- ============================================================================
-- 6. Hapus Tabel (urutan penting: child dulu, baru parent)
-- ============================================================================

DROP TABLE IF EXISTS watch_room_activity_log CASCADE;
DROP TABLE IF EXISTS watch_room_invitations CASCADE;
DROP TABLE IF EXISTS watch_room_participants CASCADE;
DROP TABLE IF EXISTS watch_rooms CASCADE;

-- ============================================================================
-- 7. Hapus Indexes (CASCADE di atas seharusnya sudah menghapus, tapi jaga-jaga)
-- ============================================================================

DROP INDEX IF EXISTS idx_watch_rooms_host_id;
DROP INDEX IF EXISTS idx_watch_rooms_code;
DROP INDEX IF EXISTS idx_watch_rooms_active;
DROP INDEX IF EXISTS idx_watch_rooms_created_at;
DROP INDEX IF EXISTS idx_watch_room_participants_room_id;
DROP INDEX IF EXISTS idx_watch_room_participants_user_id;
DROP INDEX IF EXISTS idx_watch_room_invitations_code;
DROP INDEX IF EXISTS idx_watch_room_invitations_room_id;
DROP INDEX IF EXISTS idx_watch_room_activity_log_room_created;
DROP INDEX IF EXISTS idx_watch_room_activity_log_user_id;

-- ============================================================================
-- 8. Hapus Functions
-- ============================================================================

DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS generate_invite_code();
DROP FUNCTION IF EXISTS set_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_rooms();
DROP FUNCTION IF EXISTS cleanup_stale_participants();
DROP FUNCTION IF EXISTS is_room_participant(UUID, UUID);

-- ============================================================================
-- SELESAI — Semua objek Watch Party telah dihapus dari database.
-- ============================================================================
