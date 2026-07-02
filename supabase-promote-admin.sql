-- =========================================================================================
-- QEdit Super Admin Upgrade Script
-- 
-- Run this in your Supabase SQL Editor. 
-- It updates the `authorized_users` constraint to allow the "superadmin" status.
-- =========================================================================================

ALTER TABLE authorized_users 
  DROP CONSTRAINT IF EXISTS authorized_users_status_check;

ALTER TABLE authorized_users 
  ADD CONSTRAINT authorized_users_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'admin', 'superadmin'));

-- Done!
