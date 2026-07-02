-- ============================================================
-- QEdit: System Settings Table
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
('institutionName', 'SRM Institute of Science and Technology'),
('college', 'Faculty of Science and Humanities, KTR')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read" ON system_settings
  FOR SELECT TO authenticated USING (true);
