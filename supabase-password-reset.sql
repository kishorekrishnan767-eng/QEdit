-- ============================================================
-- QEdit: Password Reset Tokens Table
-- Run this ONCE in your Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens(email);

-- Optional: Enable Row Level Security (recommended)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only the service role (server-side) can read/write this table
-- Client-side (anon) cannot access it at all
DROP POLICY IF EXISTS "service_role_only" ON password_reset_tokens;
CREATE POLICY "service_role_only" ON password_reset_tokens
  USING (false)
  WITH CHECK (false);
