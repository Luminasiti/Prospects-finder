'use client';

import React, { useState, useMemo } from 'react';
import { 
  Business, 
  FilterType 
} from '@/lib/types';
import { 
  Download, 
  Search, 
  Globe, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  ChevronRight, 
  SlidersHorizontal,
  ChevronLeft,
  X,
  FileSpreadsheet,
  BookmarkPlus,
  CheckSquare,
  Square,
  Users,
  Loader2
} from 'lucide-react';

interface ResultsDrawerProps {
  businesses: Business[];
  selectedBusinessId: string | null;
  onSelectBusiness: (business: Business) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onExportCsv: (filteredBusinesses: Business[]) => void;
  isExporting: boolean;
  onSaveToCrm: (businessesToSave: Business[]) => void;
  savedBusinessIds: Set<string>;
  onAuditSingleLead?: (business: Business) => Promise<void>;
  auditingLeadId?: string | null;
}

export const ResultsDrawer: React.FC<ResultsDrawerProps> = ({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  isCollapsed,
  onToggleCollapse,
  onExportCsv,
  isExporting,
  onSaveToCrm,
  savedBusinessIds,
  onAuditSingleLead,
  auditingLeadId,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score_asc' | 'score_desc' | 'name'>('score_asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Compute metric pill counters
  const metrics = useMemo(() => {
    let total = businesses.length;
    let redesign = 0;
    let poorAi = 0;
    let noSsl = 0;
    let missingWeb = 0;
    let high = 0;

    businesses.forEach((b) => {
      if (!b.website_url) {
        missingWeb++;
      } else if (b.audit) {
        if (b.audit.score !== null && b.audit.score < 50) redesign++;
        if (b.audit.score !== null && b.audit.score >= 75) high++;
        if (!b.audit.has_ssl || (b.audit.http_status && b.audit.http_status >= 400)) noSsl++;
        if (b.audit.ai_critique && b.audit.ai_critique.design_score < 50) poorAi++;
      }
    });

    return { total, redesign, poorAi, noSsl, missingWeb, high };
  }, [businesses]);

  // Filter & Sort leads
  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];

    // Filter by category tabs
    if (activeFilter === 'redesign') {
      list = list.filter(b => b.website_url && b.audit?.score !== null && (b.audit?.score || 0) < 50);
    } else if (activeFilter === 'poor_ai_design') {
      list = list.filter(b => b.website_url && b.audit?.ai_critique && b.audit.ai_critique.design_score < 50);
    } else if (activeFilter === 'no_ssl') {
      list = list.filter(b => b.website_url && (!b.audit?.has_ssl || (b.audit?.http_status && b.audit.http_status >= 400)));
    } else if (activeFilter === 'missing_website') {
      list = list.filter(b => !b.website_url);
    } else if (activeFilter === 'high_performing') {
      list = list.filter(b => b.website_url && b.audit?.score !== null && (b.audit?.score || 0) >= 75);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        b =>
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const scoreA = a.audit?.score ?? (a.website_url ? 50 : -1);
      const scoreB = b.audit?.score ?? (b.website_url ? 50 : -1);

      if (sortBy === 'score_asc') {
        return scoreA - scoreB;
      } else {
        return scoreB - scoreA;
      }
    });

    return list;
  }, [businesses, activeFilter, searchQuery, sortBy]);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBusinesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBusinesses.map(b => b.id)));
    }
  };

  const handleSelectRedesignOnly = () => {
    const redesigns = filteredBusinesses.filter(
      b => b.website_url && b.audit?.score !== null && (b.audit?.score || 0) < 50
    );
    setSelectedIds(new Set(redesigns.map(b => b.id)));
  };

  const selectedBusinessesList = useMemo(() => {
    return businesses.filter(b => selectedIds.has(b.id));
  }, [businesses, selectedIds]);

  const leadsForExport = selectedIds.size > 0 ? selectedBusinessesList : filteredBusinesses;

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="neo-btn absolute top-20 right-4 z-30 bg-[#FFE600] text-black p-3.5 flex items-center gap-2 cursor-pointer shadow-[3.5px_3.5px_0px_0px_#000]"
        title="Open Results Drawer"
      >
        <ChevronLeft className="w-5 h-5 text-black stroke-[3]" />
        <span className="text-xs font-black">
          RESULTS ({businesses.length})
        </span>
      </button>
    );
  }

  return (
    <aside className="w-full lg:w-[480px] xl:w-[540px] h-full bg-slate-950 border-l-2 border-black flex flex-col z-20 shadow-[-4px_0px_0px_0px_#000] shrink-0 overflow-hidden">
      {/* Top Drawer Header: Title & Actions */}
      <div className="p-4 border-b-2 border-black bg-slate-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Collapse Drawer"
          >
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
          <div>
            <h2 className="font-black text-sm text-white flex items-center gap-2">
              <span>DISCOVERED LEADS</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#FFE600] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                {businesses.length}
              </span>
            </h2>
            <p className="text-[11px] font-bold text-slate-400">Select leads to move to CRM or export</p>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={() => onExportCsv(leadsForExport)}
          disabled={isExporting || leadsForExport.length === 0}
          className="neo-btn flex items-center gap-1.5 bg-[#00F59B] hover:bg-[#00E58F] disabled:opacity-50 text-black text-xs font-black px-3.5 py-1.5 shadow-[2.5px_2.5px_0px_0px_#000]"
          title="Export CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>
            {selectedIds.size > 0
              ? `EXPORT (${selectedIds.size})`
              : `EXPORT CSV (${filteredBusinesses.length})`}
          </span>
        </button>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-2.5 bg-[#FFE600] border-b-2 border-black flex items-center justify-between gap-2 text-xs font-black text-black">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-black stroke-[3]" />
            <span>{selectedIds.size} LEADS SELECTED</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveToCrm(selectedBusinessesList)}
              className="neo-btn flex items-center gap-1 bg-black text-white px-3 py-1 text-xs shadow-[2px_2px_0px_0px_#000]"
            >
              <BookmarkPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save to CRM List</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-black font-black hover:underline px-1.5 py-0.5"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="p-3 border-b-2 border-black bg-slate-900/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
              : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          All ({metrics.total})
        </button>

        <button
          onClick={() => setActiveFilter('redesign')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1 ${
            activeFilter === 'redesign'
              ? 'bg-[#FB7185] text-black shadow-[2px_2px_0px_0px_#000]'
              : 'bg-slate-800 text-[#FB7185] shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          <span>Redesign (&lt;50)</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
            {metrics.redesign}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('poor_ai_design')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1 ${
            activeFilter === 'poor_ai_design'
              ? 'bg-[#C084FC] text-black shadow-[2px_2px_0px_0px_#000]'
              : 'bg-slate-800 text-[#C084FC] shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          <Sparkles className="w-3 h-3 stroke-[2.5]" />
          <span>AI Poor UI</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
            {metrics.poorAi}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('no_ssl')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1 ${
            activeFilter === 'no_ssl'
              ? 'bg-[#F59E0B] text-black shadow-[2px_2px_0px_0px_#000]'
              : 'bg-slate-800 text-[#F59E0B] shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          <span>No SSL</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
            {metrics.noSsl}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('high_performing')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1 ${
            activeFilter === 'high_performing'
              ? 'bg-[#00F59B] text-black shadow-[2px_2px_0px_0px_#000]'
              : 'bg-slate-800 text-[#00F59B] shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          <span>Good (≥75)</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
            {metrics.high}
          </span>
        </button>
      </div>

      {/* Search & Selection Sub-bar */}
      <div className="p-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-2 bg-slate-950">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full bg-white border-2 border-black rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-black placeholder-slate-500 shadow-[2px_2px_0px_0px_#000] focus:outline-none"
          />
        </div>

        {/* Selection Shortcuts */}
        <div className="flex items-center gap-1.5 text-xs font-black">
          <button
            onClick={handleSelectAll}
            className="neo-btn bg-white hover:bg-slate-100 text-black px-2.5 py-1 text-xs shadow-[2px_2px_0px_0px_#000]"
          >
            {selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0
              ? 'Deselect'
              : 'Select All'}
          </button>

          <button
            onClick={handleSelectRedesignOnly}
            className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black px-2.5 py-1 text-xs shadow-[2px_2px_0px_0px_#000]"
            title="Select all leads with score < 50"
          >
            Pick Hot Leads
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border-2 border-black text-black font-bold text-xs rounded-xl px-2.5 py-1 shadow-[2px_2px_0px_0px_#000] focus:outline-none cursor-pointer"
          >
            <option value="score_asc">Lowest Score</option>
            <option value="score_desc">Highest Score</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-900 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
            <AlertCircle className="w-8 h-8 text-[#FFE600] mx-auto mb-2 stroke-[2.5]" />
            <p className="text-sm font-black text-white">NO LEADS FOUND</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Try adjusting your filter, changing the search radius, or selecting another niche.
            </p>
          </div>
        ) : (
          filteredBusinesses.map((b) => {
            const audit = b.audit;
            const isSelected = b.id === selectedBusinessId;
            const isChecked = selectedIds.has(b.id);
            const isSaved = savedBusinessIds.has(b.id) || savedBusinessIds.has(b.place_id || '');
            const hasWeb = Boolean(b.website_url);

            return (
              <div
                key={b.id}
                onClick={() => onSelectBusiness(b)}
                className={`neo-card p-4 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-[#38BDF8]/20 border-2 border-black shadow-[4px_4px_0px_0px_#38BDF8]'
                    : isSelected
                    ? 'bg-slate-900 border-2 border-[#FFE600] shadow-[4px_4px_0px_0px_#FFE600]'
                    : 'bg-slate-900 hover:bg-slate-800/90 border-2 border-black shadow-[3.5px_3.5px_0px_0px_#000]'
                }`}
              >
                {/* Header: Checkbox, Business Name & Score Badge */}
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggleSelect(b.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white truncate leading-tight">
                          {b.name}
                        </h3>
                        {isSaved && (
                          <span className="text-[10px] bg-[#00F59B] text-black font-black px-1.5 py-0.2 rounded-md border border-black shadow-[1px_1px_0px_0px_#000]">
                            CRM SAVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                        📍 {b.address}
                      </p>
                    </div>
                  </div>

                  {/* Audit Score Pill */}
                  {audit && audit.score !== null ? (
                    <div
                      className={`flex flex-col items-center px-2.5 py-1 rounded-xl border-2 border-black font-black text-xs shrink-0 shadow-[2px_2px_0px_0px_#000] ${
                        audit.score >= 75
                          ? 'bg-[#00F59B] text-black'
                          : audit.score >= 50
                          ? 'bg-[#FFE600] text-black'
                          : 'bg-[#FB7185] text-black animate-pulse'
                      }`}
                    >
                      <span className="text-sm font-black leading-none">{audit.score}</span>
                      <span className="text-[8px] uppercase font-black tracking-wider opacity-90 mt-0.5">
                        {audit.score >= 75 ? 'Healthy' : audit.score >= 50 ? 'Mediocre' : 'Redesign'}
                      </span>
                    </div>
                  ) : !hasWeb ? (
                    <div className="px-2 py-1 rounded-xl border-2 border-black bg-slate-700 text-white text-[10px] font-black shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
                      NO WEB
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-xl border-2 border-black bg-[#38BDF8] text-black text-[10px] font-black shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
                      PENDING
                    </div>
                  )}
                </div>

                {/* Contact Info & Website */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mb-2.5 pl-6 font-semibold">
                  <a
                    href={`tel:${b.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-white text-slate-200"
                  >
                    <Phone className="w-3 h-3 text-slate-400 stroke-[2.5]" />
                    <span>{b.phone}</span>
                  </a>

                  {hasWeb ? (
                    <a
                      href={b.website_url!}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[#38BDF8] hover:text-cyan-300 hover:underline max-w-[200px] truncate"
                    >
                      <Globe className="w-3 h-3 shrink-0 stroke-[2.5]" />
                      <span className="truncate">{b.website_url}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic">No website URL</span>
                  )}
                </div>

                {/* Detected Issues Tags & Quick Save Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pl-6 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {audit?.has_ssl === false && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#FB7185] text-black border-1.5 border-black shadow-[1px_1px_0px_0px_#000]">
                        <ShieldAlert className="w-2.5 h-2.5 stroke-[3]" />
                        NO SSL
                      </span>
                    )}

                    {audit?.mobile_score !== null && audit?.mobile_score !== undefined && audit.mobile_score < 50 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#FFE600] text-black border-1.5 border-black shadow-[1px_1px_0px_0px_#000]">
                        <Zap className="w-2.5 h-2.5 fill-black" />
                        SLOW ({audit.mobile_score})
                      </span>
                    )}

                    {audit?.ai_critique?.era && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black text-slate-200 border border-slate-700">
                        {audit.ai_critique.era}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onAuditSingleLead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditSingleLead(b);
                        }}
                        disabled={!b.website_url || auditingLeadId === b.id}
                        className="neo-btn text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] bg-[#FFE600] hover:bg-[#FACC15] disabled:opacity-40 text-black cursor-pointer"
                        title={b.website_url ? "Run singular audit & AI critique for this website" : "No website to audit"}
                      >
                        {auditingLeadId === b.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin stroke-[3]" />
                            <span>AUDITING...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 fill-black text-black" />
                            <span>{audit?.score !== null && audit?.score !== undefined ? 'RE-AUDIT' : 'AUDIT'}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveToCrm([b]);
                      }}
                      className={`neo-btn text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] ${
                        isSaved
                          ? 'bg-[#00F59B] text-black'
                          : 'bg-white text-black hover:bg-slate-100'
                      }`}
                    >
                      <BookmarkPlus className="w-3 h-3 stroke-[2.5]" />
                      <span>{isSaved ? 'SAVED' : '+ SAVE'}</span>
                    </button>

                    <span className="text-[11px] font-black text-[#38BDF8] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      DETAILS <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
