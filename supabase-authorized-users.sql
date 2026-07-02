-- ============================================================
-- QEdit: Authorized Users Table
-- Run this ONCE in your Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- This table controls who is allowed to register using email/password.
-- Add authorized emails here before users try to register.

CREATE TABLE IF NOT EXISTS authorized_users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  role       text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);

-- Enable RLS (service role key bypasses this)
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- No public access — only the service role can read/write this table
-- (All access happens via server-side API routes using SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "service_role_only" ON authorized_users
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- After running the above, insert your authorized users below:
-- ============================================================

-- Example: INSERT INTO authorized_users (email, role) VALUES ('teacher@school.com', 'user');
-- Example: INSERT INTO authorized_users (email, role) VALUES ('admin@school.com', 'admin');
