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
  Layers,
  Loader2,
  Users,
  Send,
  RefreshCw,
  Briefcase
} from 'lucide-react';
import { PersonProfile } from '@/lib/types';

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
  </svg>
);

interface AuditDetailModalProps {
  business: Business | null;
  onClose: () => void;
  onReAudit?: (business: Business) => Promise<void>;
  isReAuditing?: boolean;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  business,
  onClose,
  onReAudit,
  isReAuditing,
}) => {
  const [copiedPitchType, setCopiedPitchType] = useState<'email' | 'linkedin' | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'technical' | 'ai_design' | 'pitch' | 'contacts'>('pitch');
  const [pitchFormat, setPitchFormat] = useState<'email' | 'linkedin'>('email');
  const [isEnriching, setIsEnriching] = useState(false);
  const [contacts, setContacts] = useState<{
    emails: string[];
    linkedin_company_url?: string | null;
    linkedin_profiles?: PersonProfile[];
  }>({
    emails: business?.emails || [],
    linkedin_company_url: business?.linkedin_company_url || null,
    linkedin_profiles: business?.linkedin_profiles || [],
  });

  // Sync contacts when business changes or auto-enrich
  React.useEffect(() => {
    if (!business) return;
    setContacts({
      emails: business.emails || [],
      linkedin_company_url: business.linkedin_company_url || null,
      linkedin_profiles: business.linkedin_profiles || [],
    });

    if (business.website_url && (!business.emails || business.emails.length === 0)) {
      handleEnrichContacts();
    }
  }, [business?.id]);

  const handleEnrichContacts = async () => {
    if (!business || !business.website_url || isEnriching) return;
    try {
      setIsEnriching(true);
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business }),
      });
      if (res.ok) {
        const data = await res.json();
        setContacts({
          emails: data.emails || [],
          linkedin_company_url: data.linkedin_company_url || null,
          linkedin_profiles: data.linkedin_profiles || [],
        });
      }
    } catch (err) {
      console.warn('Enrichment error in modal:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  if (!business) return null;

  const audit = business.audit;
  const aiCritique = audit?.ai_critique;
  const score = audit?.score;

  const emailPitchText = aiCritique?.email_pitch || aiCritique?.redesign_pitch || `Oggetto: ${business.name}: Quel dettaglio sul vostro sito che allontana i clienti

Gentile Team di ${business.name},

analizzando il vostro sito web (${business.website_url || 'online'}), ho notato che presenta alcuni problemi di velocità e visualizzazione da smartphone che stanno facendo perdere contatti preziosi a favore dei concorrenti.

Per questo motivo, abbiamo GIÀ sviluppato un prototipo moderno e ultra-veloce del vostro nuovo sito web. Risolve ogni problema di design e velocità ed è ottimizzato per convertire le visite in clienti.

Avreste 10 minuti questa settimana per dargli un'occhiata insieme senza impegno?
Potete prenotare una breve chiamata qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

Un cordiale saluto,
Il Team di Luminasiti`;

  const linkedinPitchText = aiCritique?.linkedin_pitch || `Buongiorno [Nome],

visitando il sito di ${business.name} ho notato che la lentezza su smartphone e il design datato stanno frenando l'acquisizione di nuovi clienti.

Abbiamo preso l'iniziativa: abbiamo GIÀ creato un prototipo moderno e ultra-veloce del vostro nuovo sito web.

Avreste 10 minuti per vederlo insieme senza impegno?
Potete fissare un momento comodo qui: [LINK PER PRENOTARE LA CHIAMATA / CALENDLY]

A presto!`;

  const handleCopyPitch = (type: 'email' | 'linkedin') => {
    const textToCopy = type === 'email' ? emailPitchText : linkedinPitchText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPitchType(type);
    setTimeout(() => setCopiedPitchType(null), 2000);
  };

  const handleCopyEmailAddress = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
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

          <div className="flex items-center gap-2">
            {onReAudit && business.website_url && (
              <button
                onClick={() => onReAudit(business)}
                disabled={isReAuditing}
                className="neo-btn flex items-center gap-1.5 bg-[#FFE600] hover:bg-[#FACC15] disabled:opacity-50 text-black text-xs font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                title="Re-run technical audit and AI critic for this site"
              >
                {isReAuditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[3]" />
                    <span>AUDITING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>RE-RUN AUDIT</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="neo-btn bg-white hover:bg-slate-100 text-black p-1.5 shadow-[2px_2px_0px_0px_#000]"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b-2 border-black bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('technical')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'technical'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span>TECHNICAL AUDIT</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_design')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pitch'
                ? 'border-[#FFE600] text-[#FFE600]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>OUTREACH SCRIPTS (ITALIANO)</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 text-xs font-black border-b-3 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contacts'
                ? 'border-[#00F59B] text-[#00F59B]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>CONTATTI & LINKEDIN</span>
            {contacts.emails.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#00F59B] text-black font-black border border-black shadow-[1px_1px_0px_0px_#000]">
                {contacts.emails.length}
              </span>
            )}
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

          {/* TAB 3: AGENCY OUTREACH PITCH SCRIPTS */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              {/* Pitch Format Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border-2 border-black p-3 rounded-2xl shadow-[3px_3px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPitchFormat('email')}
                    className={`neo-btn flex items-center gap-1.5 text-xs font-black px-3.5 py-2 shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                      pitchFormat === 'email'
                        ? 'bg-[#FFE600] text-black'
                        : 'bg-black text-slate-300 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>📧 EMAIL OUTREACH (ITALIANO)</span>
                  </button>

                  <button
                    onClick={() => setPitchFormat('linkedin')}
                    className={`neo-btn flex items-center gap-1.5 text-xs font-black px-3.5 py-2 shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                      pitchFormat === 'linkedin'
                        ? 'bg-[#38BDF8] text-black'
                        : 'bg-black text-slate-300 hover:text-white'
                    }`}
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>💼 LINKEDIN DM (ITALIANO)</span>
                  </button>
                </div>

                <button
                  onClick={() => handleCopyPitch(pitchFormat)}
                  className="neo-btn flex items-center gap-1.5 bg-[#00F59B] hover:bg-[#00E58F] text-black text-xs font-black px-4 py-2 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  {copiedPitchType === pitchFormat ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>COPIATO!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.5]" />
                      <span>COPIA TESTO</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pitch Context Banner */}
              <div className="neo-card bg-slate-900 border-2 border-black p-3.5 text-xs font-semibold text-slate-300 shadow-[3px_3px_0px_0px_#000] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] shrink-0" />
                <p>
                  Messaggio altamente persuasivo: evidenzia i punti critici di {business.name}, comunica che abbiamo <strong>già realizzato un prototipo veloce del nuovo sito</strong> e propone una verifica di <strong>10 minuti</strong> con prenotazione diretta.
                </p>
              </div>

              {/* Pitch Script Content */}
              <div className="neo-card bg-slate-900 border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#FFE600] tracking-wider">
                      {pitchFormat === 'email' ? 'TESTO EMAIL PERSONALIZZATO' : 'MESSAGGIO DIRETTO LINKEDIN'}
                    </span>
                  </div>
                  {pitchFormat === 'email' && contacts.emails.length > 0 && (
                    <span className="text-[11px] font-black text-[#00F59B]">
                      Destinatario: {contacts.emails[0]}
                    </span>
                  )}
                </div>

                <div className="bg-black border-2 border-black rounded-xl p-4 text-xs font-mono font-bold text-slate-100 leading-relaxed whitespace-pre-wrap select-all shadow-[2px_2px_0px_0px_#000]">
                  {pitchFormat === 'email' ? emailPitchText : linkedinPitchText}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                {pitchFormat === 'email' && (
                  <a
                    href={`mailto:${contacts.emails[0] || ''}?subject=${encodeURIComponent(`${business.name}: Prototipo nuovo sito web`)}&body=${encodeURIComponent(emailPitchText)}`}
                    className="neo-btn flex items-center gap-2 bg-[#FFE600] hover:bg-[#FACC15] text-black text-xs font-black px-4 py-2.5 shadow-[3px_3px_0px_0px_#000]"
                  >
                    <Mail className="w-4 h-4 stroke-[2.5]" />
                    <span>Apri nel Client Email</span>
                  </a>
                )}

                {pitchFormat === 'linkedin' && (
                  <a
                    href={
                      contacts.linkedin_company_url ||
                      `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(business.name)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="neo-btn flex items-center gap-2 bg-[#38BDF8] hover:bg-sky-400 text-black text-xs font-black px-4 py-2.5 shadow-[3px_3px_0px_0px_#000]"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>Invia o Cerca su LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <a
                  href={`tel:${business.phone}`}
                  className="neo-btn flex items-center gap-2 bg-white hover:bg-slate-100 text-black text-xs font-black px-4 py-2.5 shadow-[3px_3px_0px_0px_#000]"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Chiama {business.phone}</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTS & LINKEDIN TEAM DISCOVERY */}
          {activeTab === 'contacts' && (
            <div className="space-y-5">
              {/* Header Banner & Re-enrich Trigger */}
              <div className="neo-card bg-slate-900 border-2 border-black p-4 flex flex-wrap items-center justify-between gap-3 shadow-[4px_4px_0px_0px_#000]">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00F59B] stroke-[2.5]" />
                    <span>CONTATTI, EMAIL & LINKEDIN TEAM</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    Email estratte da Google & sito web (homepage, contatti, chi-siamo, privacy policy) e profili LinkedIn.
                  </p>
                </div>

                <button
                  onClick={handleEnrichContacts}
                  disabled={isEnriching || !business.website_url}
                  className="neo-btn flex items-center gap-1.5 bg-[#FFE600] hover:bg-[#FACC15] disabled:opacity-50 text-black text-xs font-black px-3.5 py-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  title="Esegui nuovamente la ricerca di contatti ed email"
                >
                  <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isEnriching ? 'animate-spin' : ''}`} />
                  <span>{isEnriching ? 'SCANSIONE IN CORSO...' : 'AGGIORNA CONTATTI'}</span>
                </button>
              </div>

              {/* 1. DISCOVERED EMAILS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-black tracking-wider text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFE600] stroke-[2.5]" />
                    <span>EMAIL AZIENDALI RILEVATE ({contacts.emails.length})</span>
                  </h4>
                  {contacts.emails.length > 0 && (
                    <span className="text-[11px] font-bold text-slate-400">Filtrate da loghi ed estensioni asset</span>
                  )}
                </div>

                {contacts.emails.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contacts.emails.map((email, idx) => (
                      <div
                        key={idx}
                        className="neo-card bg-slate-900 border-2 border-black p-3.5 flex items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_#000]"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-white block truncate" title={email}>
                            {email}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {idx === 0 ? 'Email Principale' : 'Email Secondaria'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyEmailAddress(email)}
                            className="neo-btn bg-white hover:bg-slate-100 text-black p-1.5 text-xs shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                            title="Copia email"
                          >
                            {copiedEmail === email ? (
                              <Check className="w-3.5 h-3.5 text-[#00F59B] stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                          </button>

                          <a
                            href={`mailto:${email}?subject=${encodeURIComponent(`${business.name}: Prototipo nuovo sito web`)}&body=${encodeURIComponent(emailPitchText)}`}
                            className="neo-btn bg-[#FFE600] hover:bg-[#FACC15] text-black p-1.5 text-xs shadow-[1.5px_1.5px_0px_0px_#000]"
                            title="Invia email con pitch precompilato"
                          >
                            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="neo-card bg-black border-2 border-black p-4 text-xs font-semibold text-slate-400 shadow-[2px_2px_0px_0px_#000]">
                    {isEnriching ? (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFE600]" />
                        <span>Ricerca automatica email sul sito in corso...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>Nessun indirizzo email pubblico trovato direttamente nelle pagine web.</span>
                        {business.website_url && (
                          <a
                            href={business.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#38BDF8] underline font-bold"
                          >
                            Apri sito web
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. LINKEDIN COMPANY & TEAM */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase font-black tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#38BDF8] stroke-[2.5]" />
                  <span>PAGINA LINKEDIN & PROFILI TEAM</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Company LinkedIn Card */}
                  <div className="neo-card bg-slate-900 border-2 border-black p-4 flex flex-col justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_#000]">
                    <div>
                      <div className="flex items-center gap-2 text-white font-black text-xs mb-1">
                        <LinkedinIcon className="w-4 h-4 text-[#38BDF8]" />
                        <span>Azienda su LinkedIn</span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">
                        {contacts.linkedin_company_url
                          ? 'Pagina aziendale ufficiale rilevata sul sito.'
                          : 'Cerca la pagina aziendale ufficiale con un click.'}
                      </p>
                    </div>

                    <a
                      href={
                        contacts.linkedin_company_url ||
                        `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(business.name)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="neo-btn flex items-center justify-center gap-2 bg-[#38BDF8] hover:bg-sky-400 text-black text-xs font-black py-2 shadow-[2px_2px_0px_0px_#000]"
                    >
                      <span>{contacts.linkedin_company_url ? 'Apri Pagina Aziendale' : 'Cerca Azienda su LinkedIn'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Team Members & Founder Search */}
                  {contacts.linkedin_profiles && contacts.linkedin_profiles.length > 0 ? (
                    contacts.linkedin_profiles.map((person, idx) => (
                      <div
                        key={idx}
                        className="neo-card bg-slate-900 border-2 border-black p-4 flex flex-col justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_#000]"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-white font-black text-xs mb-1">
                            <Users className="w-4 h-4 text-[#C084FC]" />
                            <span className="truncate">{person.name}</span>
                          </div>
                          <span className="text-[10px] bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/40 px-2 py-0.5 rounded-md font-bold">
                            {person.role || 'Fondatore / Team'}
                          </span>
                        </div>

                        <a
                          href={person.linkedin_url || person.linkedin_search_url}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-btn flex items-center justify-center gap-2 bg-[#C084FC] hover:bg-purple-400 text-black text-xs font-black py-2 shadow-[2px_2px_0px_0px_#000]"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          <span>{person.linkedin_url ? 'Visualizza Profilo' : 'Cerca su LinkedIn'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="neo-card bg-slate-900 border-2 border-black p-4 flex flex-col justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_#000]">
                      <div>
                        <div className="flex items-center gap-2 text-white font-black text-xs mb-1">
                          <Users className="w-4 h-4 text-[#FFE600]" />
                          <span>Titolare & Dipendenti</span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">
                          Cerca direttamente su LinkedIn i profili delle persone che lavorano per {business.name}.
                        </p>
                      </div>

                      <a
                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(business.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-btn flex items-center justify-center gap-2 bg-[#FFE600] hover:bg-[#FACC15] text-black text-xs font-black py-2 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <LinkedinIcon className="w-3.5 h-3.5" />
                        <span>Cerca Dipendenti su LinkedIn</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
