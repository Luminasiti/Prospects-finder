'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Database, 
  Key, 
  Sparkles, 
  MapPin, 
  Zap, 
  ExternalLink,
  Code
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    const sql = `-- Lead Finder & Website Audit Database Schema
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    boundary_geojson JSONB,
    status TEXT NOT NULL DEFAULT 'running',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    score INTEGER,
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
);`;

    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-950 border-3 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b-2 border-black bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#FFE600] stroke-[2.5]" />
            <h3 className="font-black text-base text-white">API CONNECTIONS & ARCHITECTURE</h3>
          </div>
          <button
            onClick={onClose}
            className="neo-btn bg-white hover:bg-slate-100 text-black p-1.5 shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs font-semibold text-slate-300">
          <p className="leading-relaxed text-slate-200">
            All 4 cloud integrations are fully connected in your <code className="bg-[#FFE600] text-black font-black px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]">.env.local</code> file!
          </p>

          {/* Integration Status Cards */}
          <div className="space-y-2.5">
            {/* Supabase */}
            <div className="neo-card bg-slate-900 border-2 border-black p-3.5 flex items-center justify-between shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-[#00F59B] stroke-[2.5]" />
                <div>
                  <h4 className="font-black text-white">Supabase PostgreSQL</h4>
                  <p className="text-[11px] text-slate-400">Stores scans, businesses, and CRM leads</p>
                </div>
              </div>
              <button
                onClick={handleCopySchema}
                className="neo-btn flex items-center gap-1 bg-[#00F59B] text-black px-3 py-1 text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{copiedSchema ? 'COPIED!' : 'COPY SQL'}</span>
              </button>
            </div>

            {/* Google Places */}
            <div className="neo-card bg-slate-900 border-2 border-black p-3.5 flex items-center justify-between shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#38BDF8] stroke-[2.5]" />
                <div>
                  <h4 className="font-black text-white">Google Places API (New)</h4>
                  <p className="text-[11px] text-slate-400">Discovers live businesses & contact details</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#38BDF8] text-black px-2.5 py-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                ACTIVE
              </span>
            </div>

            {/* PageSpeed Insights */}
            <div className="neo-card bg-slate-900 border-2 border-black p-3.5 flex items-center justify-between shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-[#FFE600] fill-[#FFE600]" />
                <div>
                  <h4 className="font-black text-white">Google PageSpeed API</h4>
                  <p className="text-[11px] text-slate-400">Audits mobile speed, SEO & Core Web Vitals</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#FFE600] text-black px-2.5 py-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                ACTIVE
              </span>
            </div>

            {/* Gemini AI */}
            <div className="neo-card bg-slate-900 border-2 border-black p-3.5 flex items-center justify-between shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#C084FC] stroke-[2.5]" />
                <div>
                  <h4 className="font-black text-white">Google Gemini 3.6 Flash</h4>
                  <p className="text-[11px] text-slate-400">Generates UX critiques & cold pitch emails</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#C084FC] text-black px-2.5 py-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
