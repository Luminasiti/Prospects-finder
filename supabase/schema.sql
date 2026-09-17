-- Lead Finder & Website Audit Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    boundary_geojson JSONB,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    place_id TEXT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website_url TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audits Table
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    has_ssl BOOLEAN DEFAULT false,
    http_status INTEGER,
    mobile_score INTEGER,
    seo_score INTEGER,
    accessibility_score INTEGER,
    lcp_ms INTEGER,
    issues_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_critique JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Saved Leads / CRM Pipeline Table
CREATE TABLE IF NOT EXISTS saved_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    website_url TEXT,
    audit_score INTEGER,
    design_score INTEGER,
    outreach_status TEXT NOT NULL DEFAULT 'not_contacted',
    follow_up_date DATE,
    notes TEXT,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    audit_data JSONB DEFAULT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_businesses_scan_id ON businesses(scan_id);
CREATE INDEX IF NOT EXISTS idx_audits_business_id ON audits(business_id);
CREATE INDEX IF NOT EXISTS idx_saved_leads_status ON saved_leads(outreach_status);
CREATE INDEX IF NOT EXISTS idx_saved_leads_follow_up ON saved_leads(follow_up_date);

-- Enable Row Level Security (RLS)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_leads ENABLE ROW LEVEL SECURITY;

-- Allow read and write access for anon / authenticated service roles
CREATE POLICY "Public read scans" ON scans FOR SELECT USING (true);
CREATE POLICY "Public insert scans" ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update scans" ON scans FOR UPDATE USING (true);

CREATE POLICY "Public read businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Public insert businesses" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update businesses" ON businesses FOR UPDATE USING (true);

CREATE POLICY "Public read audits" ON audits FOR SELECT USING (true);
CREATE POLICY "Public insert audits" ON audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update audits" ON audits FOR UPDATE USING (true);

CREATE POLICY "Public read saved_leads" ON saved_leads FOR SELECT USING (true);
CREATE POLICY "Public insert saved_leads" ON saved_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update saved_leads" ON saved_leads FOR UPDATE USING (true);
CREATE POLICY "Public delete saved_leads" ON saved_leads FOR DELETE USING (true);
