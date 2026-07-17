-- ==============================================================================
-- MIGRATION: Admin Review Workflow for QEdit
-- Adds exam category and review workflow fields to question_papers
-- ==============================================================================

-- 1. Add new columns for tracking review state
ALTER TABLE question_papers
ADD COLUMN IF NOT EXISTS exam_category TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'not_submitted',
ADD COLUMN IF NOT EXISTS reviewed_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add an index for fast admin queue filtering
CREATE INDEX IF NOT EXISTS idx_question_papers_review_queue
ON question_papers (exam_category, review_status);

-- 3. Security Definer function to check if the current user is an admin
-- This allows the RLS policy to efficiently check admin status on the DB side
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get the email of the authenticated user making the request
  v_user_email := auth.jwt() ->> 'email';
  
  IF v_user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if they have the 'admin' or 'superadmin' role in authorized_users
  SELECT EXISTS (
    SELECT 1 FROM public.authorized_users
    WHERE email = v_user_email
    AND status IN ('admin', 'superadmin')
  ) INTO v_is_admin;

  RETURN v_is_admin;
END;
$$;

-- 4. Add RLS policies for Admins
-- Admins need SELECT and UPDATE on any paper that has been submitted for review
-- (review_status != 'not_submitted')

-- Admin SELECT policy
CREATE POLICY "Admins can view submitted papers"
ON question_papers
FOR SELECT
USING (
  review_status != 'not_submitted' 
  AND public.is_current_user_admin()
);

-- Admin UPDATE policy
CREATE POLICY "Admins can update review fields of submitted papers"
ON question_papers
FOR UPDATE
USING (
  review_status != 'not_submitted' 
  AND public.is_current_user_admin()
);
