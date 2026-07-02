-- ============================================
-- QEdit: Fixed Schema (No RLS Infinite Recursion)
-- Run this in Supabase SQL Editor to replace the old schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tables (safe to re-run)
-- ============================================
CREATE TABLE IF NOT EXISTS question_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled Paper',
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'saved')),
  paper_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON question_papers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON question_papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_papers_owner ON question_papers(owner_email);

CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  collaborator_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'edit' CHECK (permission IN ('edit', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paper_id, collaborator_email)
);

CREATE INDEX IF NOT EXISTS idx_collab_email ON collaborations(collaborator_email);
CREATE INDEX IF NOT EXISTS idx_collab_paper ON collaborations(paper_id);

-- ============================================
-- SECURITY DEFINER helpers (bypass RLS for cross-table checks)
-- This is the fix for the infinite recursion issue!
-- ============================================

-- Check if current user is a collaborator on a given paper
CREATE OR REPLACE FUNCTION is_paper_collaborator(p_paper_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborations
    WHERE collaborations.paper_id = p_paper_id
      AND collaborations.collaborator_email = auth.email()
  );
$$;

-- Check if current user is owner of a given paper
CREATE OR REPLACE FUNCTION is_paper_owner(p_paper_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM question_papers
    WHERE question_papers.id = p_paper_id
      AND question_papers.owner_email = auth.email()
  );
$$;

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Owners can select own papers" ON question_papers;
DROP POLICY IF EXISTS "Owners can insert own papers" ON question_papers;
DROP POLICY IF EXISTS "Owners can update own papers" ON question_papers;
DROP POLICY IF EXISTS "Owners can delete own papers" ON question_papers;
DROP POLICY IF EXISTS "Collaborators can select shared papers" ON question_papers;
DROP POLICY IF EXISTS "Collaborators can update shared papers" ON question_papers;
DROP POLICY IF EXISTS "Owners can select collaborations" ON collaborations;
DROP POLICY IF EXISTS "Owners can insert collaborations" ON collaborations;
DROP POLICY IF EXISTS "Owners can delete collaborations" ON collaborations;
DROP POLICY IF EXISTS "Collaborators can see own entries" ON collaborations;

-- ---- question_papers policies (no cross-table refs — uses SECURITY DEFINER functions) ----

CREATE POLICY "Owners can select own papers"
  ON question_papers FOR SELECT
  USING (owner_email = auth.email());

CREATE POLICY "Owners can insert own papers"
  ON question_papers FOR INSERT
  WITH CHECK (owner_email = auth.email());

CREATE POLICY "Owners can update own papers"
  ON question_papers FOR UPDATE
  USING (owner_email = auth.email());

CREATE POLICY "Owners can delete own papers"
  ON question_papers FOR DELETE
  USING (owner_email = auth.email());

-- Uses SECURITY DEFINER function — avoids mutual recursion with collaborations policies
CREATE POLICY "Collaborators can select shared papers"
  ON question_papers FOR SELECT
  USING (is_paper_collaborator(id));

CREATE POLICY "Collaborators can update shared papers"
  ON question_papers FOR UPDATE
  USING (is_paper_collaborator(id));

-- ---- collaborations policies (uses SECURITY DEFINER function for cross-table check) ----

-- Owner can manage collaborations for their papers
CREATE POLICY "Owners can select collaborations"
  ON collaborations FOR SELECT
  USING (is_paper_owner(paper_id));

CREATE POLICY "Owners can insert collaborations"
  ON collaborations FOR INSERT
  WITH CHECK (is_paper_owner(paper_id));

CREATE POLICY "Owners can delete collaborations"
  ON collaborations FOR DELETE
  USING (is_paper_owner(paper_id));

-- Collaborators can see their own entries
CREATE POLICY "Collaborators can see own entries"
  ON collaborations FOR SELECT
  USING (collaborator_email = auth.email());
