'use client';

import React, { useState } from 'react';
import { Business, Audit, AiCritique } from '@/lib/types';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Search, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Palette, 
  TrendingUp, 
  Mail, 
  Phone, 
  Globe, 
  Layers 
} from 'lucide-react';

interface AuditDetailModalProps {
  business: Business | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  business,
  onClose,
}) => {
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [activeTab, setActiveTab] = useState<'technical' | 'ai_design' | 'pitch'>('technical');

  if (!business) return null;

  const audit = business.audit;
  const aiCritique = audit?.ai_critique;
  const score = audit?.score;

  const handleCopyPitch = () => {
    if (!aiCritique?.redesign_pitch) return;
    navigator.clipboard.writeText(aiCritique.redesign_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const getScoreBadge = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return { label: 'NO WEB', bg: 'bg-slate-700 text-white' };
    }
    if (val >= 75) return { label: 'HEALTHY', bg: 'bg-[#00F59B] text-black' };
    if (val >= 50) return { label: 'MEDIOCRE', bg: 'bg-[#FFE600] text-black' };
    return { label: 'REDESIGN', bg: 'bg-[#FB7185] text-black' };
  };

  const badge = getScoreBadge(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border-3 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b-2 border-black bg-slate-900 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-white truncate">{business.name}</h2>
              {score !== null && score !== undefined && (
                <span
                  className={`text-xs font-black px-3 py-0.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] ${badge.bg}`}
                >
                  {badge.label} ({score}/100)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-300">
              <span>📍 {business.address}</span>
              <a href={`tel:${business.phone}`} className="text-white hover:underline">
                📞 {business.phone}
              </a>
              {business.website_url ? (
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{business.website_url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[#FB7185] font-black">NO WEBSITE LISTED</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="neo-btn bg-white hover:bg-slate-100 text-black p-1.5 shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b-2 border-black bg-slate-900/60 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('technical')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'technical'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span>TECHNICAL AUDIT (5 PILLARS)</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_design')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai_design'
                ? 'border-[#C084FC] text-[#C084FC]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>AI DESIGN CRITIC</span>
            {aiCritique && (
              <span className="text-[10px] px-2 py-0.2 rounded-md bg-[#C084FC] text-black font-black border border-black shadow-[1px_1px_0px_0px_#000]">
                {aiCritique.design_score}/100
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pitch')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-[#FFE600] text-[#FFE600]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 stroke-[2.5]" />
            <span>COLD PITCH SCRIPT</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TECHNICAL AUDIT PILLARS */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              {/* Overall Score Banner */}
              <div className="neo-card bg-slate-900 border-2 border-black p-5 flex items-center justify-between gap-6 shadow-[5px_5px_0px_0px_#000]">
                <div>
                  <h3 className="text-xs uppercase font-black tracking-wider text-[#FFE600]">
                    COMPOSITE AUDIT SCORE
                  </h3>
                  <p className="text-xs font-bold text-slate-300 mt-1">
                    Evaluated across SSL security, mobile performance, SEO compliance, Core Web Vitals, and responsive DOM.
                  </p>
                </div>

                <div
                  className={`w-20 h-20 rounded-2xl border-2 border-black flex flex-col items-center justify-center shrink-0 font-black shadow-[3px_3px_0px_0px_#000] ${badge.bg}`}
                >
                  <span className="text-2xl leading-none">{score !== null && score !== undefined ? score : '—'}</span>
                  <span className="text-[9px] uppercase tracking-wider font-black mt-1">/ 100</span>
                </div>
              </div>

              {/* The 5 Audit Pillars Grid */}
              <div>
                <h4 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-3">
                  5 CORE TECHNICAL PILLARS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Pillar 1: SSL & Security */}
                  <div className="neo-card bg-black border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        {audit?.has_ssl ? (
                          <ShieldCheck className="w-4 h-4 text-[#00F59B] stroke-[2.5]" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-[#FB7185] stroke-[2.5]" />
                        )}
                        <span>Security & SSL</span>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] ${
                          audit?.has_ssl
                            ? 'bg-[#00F59B] text-black'
                            : 'bg-[#FB7185] text-black'
                        }`}
                      >
                        {audit?.has_ssl ? 'Active SSL' : 'Insecure'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">
                      HTTP Status: <strong className="text-white">{audit?.http_status || 'N/A'}</strong>
                    </p>
                  </div>

                  {/* Pillar 2: Mobile PageSpeed */}
                  <div className="neo-card bg-black border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#FFE600] fill-[#FFE600]" />
                        <span>Mobile Speed</span>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] ${
                          (audit?.mobile_score || 0) >= 70
                            ? 'bg-[#00F59B] text-black'
                            : (audit?.mobile_score || 0) >= 50
                            ? 'bg-[#FFE600] text-black'
                            : 'bg-[#FB7185] text-black'
                        }`}
                      >
                        {audit?.mobile_score !== null && audit?.mobile_score !== undefined
                          ? `${audit.mobile_score}/100`
                          : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">Lighthouse Mobile Engine</p>
                  </div>

                  {/* Pillar 3: Core Web Vitals */}
                  <div className="neo-card bg-black border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#38BDF8] stroke-[2.5]" />
                        <span>Core Vitals</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#38BDF8] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                        {audit?.lcp_ms ? `${(audit.lcp_ms / 1000).toFixed(1)}s LCP` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">
                      Largest Contentful Paint
                    </p>
                  </div>

                  {/* Pillar 4: SEO Readiness */}
                  <div className="neo-card bg-black border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-[#C084FC] stroke-[2.5]" />
                        <span>SEO & Meta</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#C084FC] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                        {audit?.seo_score !== null && audit?.seo_score !== undefined
                          ? `${audit.seo_score}/100`
                          : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">Title, description, headings</p>
                  </div>

                  {/* Pillar 5: Mobile Ergonomics */}
                  <div className="neo-card bg-black border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#FB7185] stroke-[2.5]" />
                        <span>Responsive DOM</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                        {audit?.issues_list?.some(i => i.toLowerCase().includes('viewport'))
                          ? 'No Viewport'
                          : 'Mobile Ready'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">Viewport meta & tags</p>
                  </div>
                </div>
              </div>

              {/* Detected Issues List */}
              <div>
                <h4 className="text-xs uppercase font-black tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#FFE600] stroke-[2.5]" />
                  <span>DETECTED FLAWS & RED FLAGS ({audit?.issues_list?.length || 0})</span>
                </h4>
                {audit?.issues_list && audit.issues_list.length > 0 ? (
                  <div className="space-y-2">
                    {audit.issues_list.map((issue, idx) => (
                      <div
                        key={idx}
                        className="neo-card bg-slate-900 border-2 border-black p-3 text-xs font-bold flex items-center gap-2.5 text-slate-200 shadow-[2.5px_2.5px_0px_0px_#000]"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185] shrink-0 border border-black" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-bold italic">No critical technical issues found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI WEBSITE DESIGN CRITIC */}
          {activeTab === 'ai_design' && (
            <div className="space-y-6">
              {aiCritique ? (
                <>
                  {/* AI Design Score & Era */}
                  <div className="neo-card bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-black p-5 flex flex-wrap items-center justify-between gap-4 shadow-[5px_5px_0px_0px_#000]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-[#FFE600] stroke-[2.5]" />
                        <h3 className="font-black text-white text-base">AI VISUAL & UX ASSESSMENT</h3>
                      </div>
                      <p className="text-xs font-bold text-slate-300">
                        Aesthetic Era:{' '}
                        <strong className="text-black bg-[#FFE600] px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]">
                          {aiCritique.era}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                          Visual Hierarchy
                        </span>
                        <span className="text-xs font-black text-[#C084FC]">
                          {aiCritique.visual_hierarchy_rating}
                        </span>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-[#C084FC] border-2 border-black flex flex-col items-center justify-center font-black text-black shadow-[3px_3px_0px_0px_#000]">
                        <span className="text-xl leading-none">{aiCritique.design_score}</span>
                        <span className="text-[8px] uppercase tracking-wider font-black mt-0.5">Design</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Feedback Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="neo-card bg-slate-900 border-2 border-black p-4 shadow-[3px_3px_0px_0px_#000]">
                      <div className="flex items-center gap-2 text-xs font-black text-[#FFE600] mb-2">
                        <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                        <span>Conversion Rate Optimization (CRO)</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        {aiCritique.cro_feedback}
                      </p>
                    </div>

                    <div className="neo-card bg-slate-900 border-2 border-black p-4 shadow-[3px_3px_0px_0px_#000]">
                      <div className="flex items-center gap-2 text-xs font-black text-[#38BDF8] mb-2">
                        <Palette className="w-4 h-4 stroke-[2.5]" />
                        <span>Color Contrast & Typography</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        {aiCritique.color_contrast_feedback}
                      </p>
                    </div>
                  </div>

                  {/* Detected Design Flaws */}
                  <div>
                    <h4 className="text-xs uppercase font-black tracking-wider text-slate-300 mb-3">
                      SPECIFIC UI & LAYOUT FLAWS
                    </h4>
                    <div className="space-y-2">
                      {aiCritique.flaws.map((flaw, idx) => (
                        <div
                          key={idx}
                          className="neo-card bg-black border-2 border-black p-3 text-xs font-bold flex items-center gap-2.5 text-slate-200 shadow-[2px_2px_0px_0px_#000]"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC] shrink-0 border border-black" />
                          <span>{flaw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  AI design critique is not available for this site.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENCY OUTREACH PITCH */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="neo-card bg-slate-900 border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFE600] stroke-[2.5]" />
                    <h3 className="font-black text-sm text-white">
                      TAILORED REDESIGN PITCH SCRIPT
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyPitch}
                    className="neo-btn flex items-center gap-1.5 bg-[#FFE600] hover:bg-[#FACC15] text-black text-xs font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>COPY SCRIPT</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black border-2 border-black rounded-xl p-4 text-xs font-mono font-bold text-slate-200 leading-relaxed whitespace-pre-wrap select-all shadow-[2px_2px_0px_0px_#000]">
                  {aiCritique?.redesign_pitch ||
                    `Hi ${business.name} team,\n\nI was browsing local services in your area and noticed your site has a few critical speed and mobile display issues that could be turning away prospective customers.\n\nWould you be open to a quick 2-minute video breakdown of how a modern redesign could boost your conversions?`}
                </div>
              </div>

              {/* Outreach Actions */}
              <div className="flex items-center justify-end gap-3">
                <a
                  href={`tel:${business.phone}`}
                  className="neo-btn flex items-center gap-2 bg-white hover:bg-slate-100 text-black text-xs font-black px-4 py-2 shadow-[3px_3px_0px_0px_#000]"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Call {business.phone}</span>
                </a>

                {business.website_url && (
                  <a
                    href={business.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="neo-btn flex items-center gap-2 bg-[#38BDF8] hover:bg-cyan-400 text-black text-xs font-black px-4 py-2 shadow-[3px_3px_0px_0px_#000]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Open Live Website</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
