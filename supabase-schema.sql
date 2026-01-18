-- Supabase Schema for Claude Live Coding
-- Run this in your Supabase SQL Editor

-- Table to store page states/versions
CREATE TABLE page_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  instruction TEXT,
  files JSONB DEFAULT '[]'::jsonb
);

-- Migration for existing tables (run if table already exists):
-- ALTER TABLE page_state ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- Index for fast version lookups
CREATE INDEX idx_page_state_version ON page_state(version DESC);

-- Enable Realtime for this table (optional, we use broadcast channels)
ALTER PUBLICATION supabase_realtime ADD TABLE page_state;

-- Row Level Security (optional but recommended)
ALTER TABLE page_state ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON page_state
  FOR SELECT
  USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role insert" ON page_state
  FOR INSERT
  WITH CHECK (true);
