-- ============================================================
-- NEXUS — Supabase Migration: Agent Activity Feed
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Agent activity log table
CREATE TABLE IF NOT EXISTS agent_activity (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id     UUID REFERENCES goals(id) ON DELETE CASCADE,
  agent_name  TEXT NOT NULL,
  action_type TEXT NOT NULL,
  message     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user feed queries (newest first)
CREATE INDEX IF NOT EXISTS idx_activity_user_time
  ON agent_activity(user_id, created_at DESC);

-- Index for per-goal activity
CREATE INDEX IF NOT EXISTS idx_activity_goal
  ON agent_activity(goal_id, created_at DESC);

-- Row Level Security: users only see their own activity
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own activity"
  ON agent_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Backend can insert activity"
  ON agent_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Outreach log table (track sent WhatsApp messages)
-- ============================================================

CREATE TABLE IF NOT EXISTS outreach_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id       UUID REFERENCES goals(id) ON DELETE CASCADE,
  channel       TEXT DEFAULT 'whatsapp',       -- whatsapp | email | sms
  message_sid   TEXT,                           -- Twilio message SID
  message_body  TEXT,
  status        TEXT DEFAULT 'sent',            -- sent | delivered | read | failed
  user_reply    TEXT,                           -- YES | NO | null
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  replied_at    TIMESTAMPTZ
);

ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own outreach"
  ON outreach_log FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- Verify
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_activity', 'outreach_log');
