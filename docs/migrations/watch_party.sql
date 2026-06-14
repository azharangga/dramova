-- ============================================================================
-- DRAMOVA WATCH PARTY (NONTON BARENG)
-- Database Migration untuk Supabase PostgreSQL
-- ============================================================================

-- Aktifkan extension yang diperlukan
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. FUNCTIONS
-- ============================================================================

-- Generate unique 6-character room code (uppercase alphanumeric)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars    CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code   TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM watch_rooms WHERE watch_rooms.code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Generate unique invite code (8-character alphanumeric)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars    CONSTANT TEXT := 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code   TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM watch_room_invitations WHERE watch_room_invitations.code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Cleanup expired rooms (run via pg_cron or Supabase Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deactivated INTEGER;
BEGIN
  UPDATE watch_rooms
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND (expires_at IS NOT NULL AND expires_at < NOW());
  GET DIAGNOSTICS deactivated = ROW_COUNT;
  RETURN deactivated;
END;
$$;

-- Cleanup stale participants (no heartbeat for >60s)
CREATE OR REPLACE FUNCTION cleanup_stale_participants()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  removed INTEGER;
BEGIN
  DELETE FROM watch_room_participants
  WHERE status != 'disconnected'
    AND last_heartbeat_at < NOW() - INTERVAL '60 seconds';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

-- Check if user is participant in a room (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_room_participant(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM watch_room_participants
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
END;
$$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Room metadata
CREATE TABLE watch_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE DEFAULT generate_room_code(),
  host_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 120),
  content_type    TEXT NOT NULL CHECK (content_type IN ('shorts', 'series', 'movie')),
  platform        TEXT NOT NULL CHECK (char_length(platform) <= 60),
  content_id      TEXT NOT NULL CHECK (char_length(content_id) <= 300),
  content_title   TEXT NOT NULL DEFAULT '' CHECK (char_length(content_title) <= 300),
  current_episode INTEGER NOT NULL DEFAULT 1 CHECK (current_episode >= 1),
  playback_state  JSONB NOT NULL DEFAULT '{"status":"paused","currentTime":0,"episode":1}'::JSONB,
  max_participants INTEGER NOT NULL DEFAULT 20 CHECK (max_participants BETWEEN 2 AND 100),
  is_private      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  settings        JSONB NOT NULL DEFAULT '{"allowSeek":true,"allowPause":true,"allowNextEp":true,"chatEnabled":true}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- Trigger to auto-update updated_at
CREATE TRIGGER trg_watch_rooms_updated_at
  BEFORE UPDATE ON watch_rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Participants
CREATE TABLE watch_room_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          UUID NOT NULL REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('host', 'moderator', 'viewer')),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'buffering', 'disconnected')),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

-- Invitations
CREATE TABLE watch_room_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES watch_rooms(id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE DEFAULT generate_invite_code(),
  max_uses     INTEGER NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count   INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log (audit trail)
CREATE TABLE watch_room_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL CHECK (char_length(action) <= 60),
  metadata     JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_watch_rooms_host_id      ON watch_rooms(host_id);
CREATE INDEX idx_watch_rooms_code         ON watch_rooms(code);
CREATE INDEX idx_watch_rooms_active       ON watch_rooms(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_watch_rooms_created_at   ON watch_rooms(created_at DESC);

CREATE INDEX idx_watch_room_participants_room_id ON watch_room_participants(room_id);
CREATE INDEX idx_watch_room_participants_user_id ON watch_room_participants(user_id);

CREATE INDEX idx_watch_room_invitations_code      ON watch_room_invitations(code);
CREATE INDEX idx_watch_room_invitations_room_id   ON watch_room_invitations(room_id);

CREATE INDEX idx_watch_room_activity_log_room_created ON watch_room_activity_log(room_id, created_at DESC);
CREATE INDEX idx_watch_room_activity_log_user_id      ON watch_room_activity_log(user_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_activity_log ENABLE ROW LEVEL SECURITY;

-- ── watch_rooms ──

-- Anyone authenticated can read active rooms (public) or rooms they are host of
CREATE POLICY "read_rooms" ON watch_rooms
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    OR host_id = auth.uid()
    OR is_room_participant(id, auth.uid())
  );

-- Authenticated users can create rooms (they become host)
CREATE POLICY "create_rooms" ON watch_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Only host can update room
CREATE POLICY "update_rooms" ON watch_rooms
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Only host can soft-delete (set is_active = false)
CREATE POLICY "delete_rooms" ON watch_rooms
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid());

-- ── watch_room_participants ──

-- Participants can read other participants in same room
CREATE POLICY "read_participants" ON watch_room_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_room_participant(room_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_participants.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- Users can insert themselves as participants (must be the user_id)
CREATE POLICY "join_participants" ON watch_room_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participant record
CREATE POLICY "update_own_participant" ON watch_room_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Host or self can delete participant records (kick or leave)
CREATE POLICY "delete_participants" ON watch_room_participants
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_participants.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- ── watch_room_invitations ──

-- Host can read invitations for their rooms
CREATE POLICY "read_invitations" ON watch_room_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_invitations.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- Host can create invitations for their rooms
CREATE POLICY "create_invitations" ON watch_room_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_invitations.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- Host can update invitations for their rooms
CREATE POLICY "update_invitations" ON watch_room_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_invitations.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- ── watch_room_activity_log ──

-- Participants can read activity log for their rooms
CREATE POLICY "read_activity" ON watch_room_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM watch_room_participants wp
      WHERE wp.room_id = watch_room_activity_log.room_id
        AND wp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM watch_rooms wr
      WHERE wr.id = watch_room_activity_log.room_id
        AND wr.host_id = auth.uid()
    )
  );

-- Any authenticated user in a room can insert activity
CREATE POLICY "insert_activity" ON watch_room_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM watch_room_participants wp
      WHERE wp.room_id = watch_room_activity_log.room_id
        AND wp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. REALTIME PUBLICATION (Supabase Realtime)
-- ============================================================================

-- Enable realtime on watch_rooms for database changes (optional, for presence)
ALTER PUBLICATION supabase_realtime ADD TABLE watch_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_participants;

-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- Active rooms with participant count
CREATE OR REPLACE VIEW watch_rooms_active AS
SELECT
  wr.*,
  COUNT(wp.id) AS participant_count
FROM watch_rooms wr
LEFT JOIN watch_room_participants wp ON wp.room_id = wr.id
WHERE wr.is_active = TRUE
GROUP BY wr.id;

-- ============================================================================
-- 7. GRANTS (ensure authenticated role has proper access)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON watch_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON watch_room_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON watch_room_invitations TO authenticated;
GRANT SELECT, INSERT ON watch_room_activity_log TO authenticated;
