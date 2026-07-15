-- ============================================================
-- QEdit: Admin Approval System — authorized_users table
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- Create new table with approval status if it does not exist
CREATE TABLE IF NOT EXISTS authorized_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL UNIQUE,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected', 'admin', 'superadmin')),
  approved_by text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_au_email  ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_au_status ON authorized_users(status);

-- Enable Row Level Security
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Only server-side (service role) can access this table
DROP POLICY IF EXISTS "service_role_only" ON authorized_users;
CREATE POLICY "service_role_only" ON authorized_users
  USING (false) WITH CHECK (false);

-- ============================================================
-- (Optional) Pre-approve any initial email manually if needed
-- ============================================================
-- INSERT INTO authorized_users (email, status, approved_by)
-- VALUES ('user@example.com', 'approved', 'system')
-- ON CONFLICT (email) DO UPDATE SET status = 'approved';
