-- ============================================
-- QEdit: Access Requests Table + RLS
-- Run this as a SEPARATE query in Supabase SQL Editor
-- (after supabase-schema.sql has already been run)
-- ============================================

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paper_id, requester_email)
);

CREATE INDEX IF NOT EXISTS idx_requests_paper ON access_requests(paper_id);
CREATE INDEX IF NOT EXISTS idx_requests_email ON access_requests(requester_email);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function to check if current user owns the paper for a request
CREATE OR REPLACE FUNCTION is_request_paper_owner(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM access_requests ar
    JOIN question_papers qp ON qp.id = ar.paper_id
    WHERE ar.id = p_request_id
      AND qp.owner_email = auth.email()
  );
$$;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Requesters can insert own requests" ON access_requests;
DROP POLICY IF EXISTS "Requesters can view own requests" ON access_requests;
DROP POLICY IF EXISTS "Owners can view requests for their papers" ON access_requests;
DROP POLICY IF EXISTS "Owners can update request status" ON access_requests;

-- Requester can send a request
CREATE POLICY "Requesters can insert own requests"
  ON access_requests FOR INSERT
  WITH CHECK (requester_email = auth.email());

-- Requester can view their own requests
CREATE POLICY "Requesters can view own requests"
  ON access_requests FOR SELECT
  USING (requester_email = auth.email());

-- Owner can view all requests for their papers (uses SECURITY DEFINER)
CREATE POLICY "Owners can view requests for their papers"
  ON access_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_papers
      WHERE question_papers.id = access_requests.paper_id
        AND question_papers.owner_email = auth.email()
    )
  );

-- Owner can approve/deny requests
CREATE POLICY "Owners can update request status"
  ON access_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM question_papers
      WHERE question_papers.id = access_requests.paper_id
        AND question_papers.owner_email = auth.email()
    )
  );
