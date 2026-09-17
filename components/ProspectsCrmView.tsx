'use client';

import React, { useState, useMemo } from 'react';
import { SavedLead, OutreachStatus, Business } from '@/lib/types';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Phone, 
  Globe, 
  ExternalLink, 
  FileSpreadsheet, 
  Tag, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  AlertCircle, 
  Edit3, 
  Check, 
  X, 
  ChevronDown, 
  Layers,
  ArrowUpDown,
  Filter,
  Folder,
  FolderPlus,
  Table as TableIcon,
  LayoutGrid,
  Copy,
  CheckSquare,
  Square,
  ChevronRight
} from 'lucide-react';

interface ProspectsCrmViewProps {
  savedLeads: SavedLead[];
  onUpdateLead: (updatedLead: SavedLead) => void;
  onDeleteLead: (leadId: string) => void;
  onSelectBusinessForModal: (business: Business) => void;
  onExportCsv: (leadsToExport: SavedLead[]) => void;
  isExporting: boolean;
  theme?: 'dark' | 'light';
}

const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; bg: string; border: string }> = {
  not_contacted: { label: 'Not Contacted', color: 'text-black', bg: 'bg-white', border: 'border-black' },
  contacted: { label: 'Contacted 📨', color: 'text-black', bg: 'bg-[#38BDF8]', border: 'border-black' },
  follow_up_needed: { label: 'Follow-Up ⏰', color: 'text-black', bg: 'bg-[#FFE600]', border: 'border-black' },
  replied: { label: 'Replied 💬', color: 'text-black', bg: 'bg-[#00F59B]', border: 'border-black' },
  meeting_booked: { label: 'Meeting 📅', color: 'text-black', bg: 'bg-[#C084FC]', border: 'border-black' },
  closed_deal: { label: 'Closed Deal 🏆', color: 'text-black', bg: 'bg-[#4ADE80]', border: 'border-black' },
  lost: { label: 'Lost / Passed ❌', color: 'text-white', bg: 'bg-[#FB7185]', border: 'border-black' },
};

function getCleanDomain(url: string | null): string {
  if (!url) return '';
  try {
    const formatted = url.startsWith('http') ? url : `https://${url}`;
    const u = new URL(formatted);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

export const ProspectsCrmView: React.FC<ProspectsCrmViewProps> = ({
  savedLeads,
  onUpdateLead,
  onDeleteLead,
  onSelectBusinessForModal,
  onExportCsv,
  isExporting,
  theme = 'dark',
}) => {
  const [activeListFilter, setActiveListFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Quick Popovers
  const [activeNotesLeadId, setActiveNotesLeadId] = useState<string | null>(null);
  const [activeFollowUpLeadId, setActiveFollowUpLeadId] = useState<string | null>(null);
  const [activeChangeListLeadId, setActiveChangeListLeadId] = useState<string | null>(null);
  const [addingCustomFieldLeadId, setAddingCustomFieldLeadId] = useState<string | null>(null);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New List creation
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListNameInput, setNewListNameInput] = useState('');
  const [customLists, setCustomLists] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('prospectpulse_custom_lists');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const isLight = theme === 'light';

  // Compute all available lists
  const availableLists = useMemo(() => {
    const leadLists = savedLeads.map(l => l.list_name || 'General Leads');
    const combined = Array.from(new Set(['General Leads', ...customLists, ...leadLists]));
    return combined;
  }, [savedLeads, customLists]);

  // List lead counts
  const listCounts = useMemo(() => {
    const counts: Record<string, number> = { all: savedLeads.length };
    availableLists.forEach(l => { counts[l] = 0; });
    savedLeads.forEach(lead => {
      const list = lead.list_name || 'General Leads';
      counts[list] = (counts[list] || 0) + 1;
    });
    return counts;
  }, [savedLeads, availableLists]);

  // Status lead counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: savedLeads.length };
    Object.keys(STATUS_CONFIG).forEach(k => { counts[k] = 0; });
    savedLeads.forEach(l => {
      const st = l.outreach_status || 'not_contacted';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [savedLeads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    let list = [...savedLeads];

    if (activeListFilter !== 'all') {
      list = list.filter(l => (l.list_name || 'General Leads') === activeListFilter);
    }

    if (activeStatusFilter !== 'all') {
      list = list.filter(l => l.outreach_status === activeStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.website_url && l.website_url.toLowerCase().includes(q)) ||
          (l.list_name && l.list_name.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [savedLeads, activeListFilter, activeStatusFilter, searchQuery]);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleStatusChange = (lead: SavedLead, newStatus: OutreachStatus) => {
    onUpdateLead({
      ...lead,
      outreach_status: newStatus,
      updated_at: new Date().toISOString(),
    });
  };

  const handleListChange = (lead: SavedLead, newListName: string) => {
    onUpdateLead({
      ...lead,
      list_name: newListName,
      custom_fields: { ...(lead.custom_fields || {}), list_name: newListName },
      updated_at: new Date().toISOString(),
    });
    setActiveChangeListLeadId(null);
  };

  const handleBulkMoveList = (targetList: string) => {
    selectedIds.forEach(id => {
      const lead = savedLeads.find(l => l.id === id);
      if (lead) {
        onUpdateLead({
          ...lead,
          list_name: targetList,
          custom_fields: { ...(lead.custom_fields || {}), list_name: targetList },
          updated_at: new Date().toISOString(),
        });
      }
    });
    setSelectedIds(new Set());
  };

  const handleDateChange = (lead: SavedLead, dateStr: string) => {
    onUpdateLead({
      ...lead,
      follow_up_date: dateStr || null,
      updated_at: new Date().toISOString(),
    });
    setActiveFollowUpLeadId(null);
  };

  const setQuickFollowUp = (lead: SavedLead, days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    handleDateChange(lead, dateStr);
  };

  const handleNotesChange = (lead: SavedLead, notes: string) => {
    onUpdateLead({
      ...lead,
      notes,
      updated_at: new Date().toISOString(),
    });
  };

  const handleAddCustomField = (lead: SavedLead) => {
    if (!customFieldKey.trim()) return;
    const nextFields = {
      ...(lead.custom_fields || {}),
      [customFieldKey.trim()]: customFieldValue.trim(),
    };
    onUpdateLead({
      ...lead,
      custom_fields: nextFields,
      updated_at: new Date().toISOString(),
    });
    setCustomFieldKey('');
    setCustomFieldValue('');
    setAddingCustomFieldLeadId(null);
  };

  const handleDeleteCustomField = (lead: SavedLead, key: string) => {
    const nextFields = { ...(lead.custom_fields || {}) };
    delete nextFields[key];
    onUpdateLead({
      ...lead,
      custom_fields: nextFields,
      updated_at: new Date().toISOString(),
    });
  };

  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListNameInput.trim();
    if (!trimmed) return;
    if (!availableLists.includes(trimmed)) {
      const updated = [...customLists, trimmed];
      setCustomLists(updated);
      try {
        localStorage.setItem('prospectpulse_custom_lists', JSON.stringify(updated));
      } catch {}
    }
    setActiveListFilter(trimmed);
    setNewListNameInput('');
    setIsCreatingList(false);
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedLeadsList = useMemo(() => {
    return savedLeads.filter(l => selectedIds.has(l.id));
  }, [savedLeads, selectedIds]);

  const leadsForExport = selectedIds.size > 0 ? selectedLeadsList : filteredLeads;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isLight ? 'bg-[#F4F0EA] text-slate-900' : 'bg-[#0b0f19] text-white'}`}>
      
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className={`p-4 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 shadow-[0px_2px_0px_0px_#000] ${
        isLight ? 'bg-white' : 'bg-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C084FC] border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] flex items-center justify-center">
            <Users className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">PROSPECTS CRM PIPELINE</h2>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#FFE600] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                {savedLeads.length} Total Leads
              </span>
            </div>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Organize leads in lists, track outreach stages, set reminders & audit redesign opportunities.
            </p>
          </div>
        </div>

        {/* Action Controls: View Switcher & Export */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className={`flex items-center border-2 border-black p-1 rounded-xl shadow-[2px_2px_0px_0px_#000] ${
            isLight ? 'bg-slate-100' : 'bg-slate-950'
          }`}>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#38BDF8] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                  : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View (Clean & Compact)"
            >
              <TableIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Table</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#38BDF8] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                  : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Card View (Visual & Expanded)"
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={() => onExportCsv(leadsForExport)}
            disabled={isExporting || leadsForExport.length === 0}
            className="neo-btn flex items-center gap-1.5 bg-[#00F59B] hover:bg-[#00E58F] disabled:opacity-50 text-black text-xs font-black px-3.5 py-2 shadow-[2.5px_2.5px_0px_0px_#000]"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>
              {selectedIds.size > 0
                ? `EXPORT SELECTED (${selectedIds.size})`
                : `EXPORT CSV (${filteredLeads.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* 2. LISTS BAR: TABS & CREATE LIST */}
      <div className={`px-4 py-2.5 border-b-2 border-black flex items-center gap-2 overflow-x-auto no-scrollbar ${
        isLight ? 'bg-amber-50/70' : 'bg-slate-950'
      }`}>
        <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
          <Folder className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Lists:</span>
        </span>

        {/* All Lists tab */}
        <button
          onClick={() => setActiveListFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1.5 ${
            activeListFilter === 'all'
              ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000] scale-[1.02]'
              : isLight
                ? 'bg-white text-slate-800 hover:bg-slate-100 shadow-[1.5px_1.5px_0px_0px_#000]'
                : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          <span>📁 All Lists</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
            {listCounts.all}
          </span>
        </button>

        {/* Individual Lists */}
        {availableLists.map((list) => {
          const isAct = activeListFilter === list;
          return (
            <button
              key={list}
              onClick={() => setActiveListFilter(list)}
              className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1.5 ${
                isAct
                  ? 'bg-[#38BDF8] text-black shadow-[2px_2px_0px_0px_#000] scale-[1.02]'
                  : isLight
                    ? 'bg-white text-slate-800 hover:bg-slate-100 shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
              }`}
            >
              <span>{list}</span>
              <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
                {listCounts[list] || 0}
              </span>
            </button>
          );
        })}

        {/* Create New List Button / Inline Input */}
        {isCreatingList ? (
          <form onSubmit={handleCreateNewList} className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              autoFocus
              value={newListNameInput}
              onChange={(e) => setNewListNameInput(e.target.value)}
              placeholder="List name..."
              className="bg-white text-black border-2 border-black rounded-xl px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#000] focus:outline-none w-36"
            />
            <button
              type="submit"
              className="neo-btn bg-[#00F59B] text-black px-2 py-1 text-xs font-black shadow-[1.5px_1.5px_0px_0px_#000]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingList(false)}
              className="p-1 bg-white text-black border border-black rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingList(true)}
            className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-dashed border-black cursor-pointer flex items-center gap-1 ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-900' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New List</span>
          </button>
        )}
      </div>

      {/* 3. FILTERS & SEARCH SUB-BAR */}
      <div className={`p-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-slate-100/90' : 'bg-slate-900/60'
      }`}>
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveStatusFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer ${
              activeStatusFilter === 'all'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                : isLight
                  ? 'bg-white text-slate-800 hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_#000]'
                  : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            All Status ({statusCounts.all})
          </button>

          {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(st => {
            const conf = STATUS_CONFIG[st];
            const isAct = activeStatusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1.5 ${
                  isAct
                    ? `${conf.bg} ${conf.color} shadow-[2.5px_2.5px_0px_0px_#000]`
                    : isLight
                      ? 'bg-white text-slate-800 hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
                }`}
              >
                <span>{conf.label}</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-black">
                  {statusCounts[st] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Selection Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, lists, notes..."
              className="w-full bg-white border-2 border-black rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-black placeholder-slate-500 shadow-[2px_2px_0px_0px_#000] focus:outline-none"
            />
          </div>

          {filteredLeads.length > 0 && (
            <button
              onClick={handleSelectAllVisible}
              className="neo-btn bg-white hover:bg-slate-100 text-black text-xs font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] whitespace-nowrap"
            >
              {selectedIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* 4. BULK ACTION BAR (WHEN LEADS CHECKED) */}
      {selectedIds.size > 0 && (
        <div className="p-2.5 bg-[#FFE600] border-b-2 border-black flex flex-wrap items-center justify-between gap-3 text-xs font-black text-black">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-black stroke-[3]" />
            <span>{selectedIds.size} PROSPECTS SELECTED</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Move to List selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] uppercase font-black">Move to list:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkMoveList(e.target.value);
                }}
                defaultValue=""
                className="bg-white text-black font-black text-xs border-2 border-black rounded-xl px-2.5 py-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                <option value="" disabled>Choose List...</option>
                {availableLists.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (confirm(`Delete ${selectedIds.size} selected leads?`)) {
                  selectedIds.forEach(id => onDeleteLead(id));
                  setSelectedIds(new Set());
                }
              }}
              className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black px-2.5 py-1 text-xs shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-black font-black hover:underline px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 5. MAIN CONTENT: TABLE VIEW OR CARDS VIEW */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredLeads.length === 0 ? (
          <div className={`text-center py-16 px-4 border-2 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <Users className="w-12 h-12 text-[#FFE600] mx-auto mb-3 stroke-[2.5]" />
            <h3 className="text-lg font-black">NO PROSPECTS FOUND</h3>
            <p className={`text-xs font-semibold mt-1 max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {activeListFilter !== 'all'
                ? `No leads currently in "${activeListFilter}". Save leads from the map or move them to this list.`
                : 'Discover businesses on the map and click "+ Save" to build your target outreach list.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ========================================================= */
          /* TABLE VIEW: CLEAN, DENSE & STREAMLINED                    */
          /* ========================================================= */
          <div className={`border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] overflow-hidden ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b-2 border-black text-[11px] font-black uppercase tracking-wider ${
                    isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-300'
                  }`}>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAllVisible}
                        className="w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer"
                      />
                    </th>
                    <th className="p-3 min-w-[240px]">Company & Website</th>
                    <th className="p-3 min-w-[140px]">List</th>
                    <th className="p-3 min-w-[130px]">Audit Score</th>
                    <th className="p-3 min-w-[160px]">Status</th>
                    <th className="p-3 min-w-[140px]">Follow-Up</th>
                    <th className="p-3 min-w-[180px]">Notes</th>
                    <th className="p-3 text-right pr-4 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/20">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedIds.has(lead.id);
                    const statusConfig = STATUS_CONFIG[lead.outreach_status] || STATUS_CONFIG.not_contacted;
                    const domain = getCleanDomain(lead.website_url);
                    const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) <= new Date();

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors ${
                          isSelected
                            ? isLight ? 'bg-sky-50' : 'bg-[#38BDF8]/15'
                            : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(lead.id)}
                            className="mt-1 w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer"
                          />
                        </td>

                        {/* Company & Website */}
                        <td className="p-3 align-top">
                          <div className="font-black text-sm text-inherit flex items-center gap-1.5">
                            <span>{lead.name}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs mt-1 font-semibold">
                            {lead.website_url ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={lead.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#38BDF8]/20 text-[#0284C7] hover:underline font-black rounded-md border border-black text-[11px]"
                                  title={lead.website_url}
                                >
                                  <Globe className="w-3 h-3 stroke-[2.5]" />
                                  <span>{domain}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <button
                                  onClick={() => copyUrl(lead.id, lead.website_url!)}
                                  className="text-slate-400 hover:text-black p-0.5"
                                  title="Copy full URL"
                                >
                                  {copiedId === lead.id ? (
                                    <Check className="w-3 h-3 text-[#00F59B]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#FB7185] font-black text-[10px] uppercase">No Website</span>
                            )}

                            {lead.phone && lead.phone !== 'Not listed' && (
                              <a
                                href={`tel:${lead.phone}`}
                                className={`flex items-center gap-1 text-[11px] ${
                                  isLight ? 'text-slate-600 hover:text-black' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{lead.phone}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* List Selector Pill */}
                        <td className="p-3 align-top">
                          <div className="relative">
                            <button
                              onClick={() => setActiveChangeListLeadId(activeChangeListLeadId === lead.id ? null : lead.id)}
                              className={`text-[11px] font-black px-2.5 py-1 rounded-xl border-2 border-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer ${
                                isLight ? 'bg-amber-100 hover:bg-amber-200 text-black' : 'bg-slate-800 hover:bg-slate-700 text-white'
                              }`}
                            >
                              <Folder className="w-3 h-3 text-[#FFE600] stroke-[2.5]" />
                              <span className="max-w-[100px] truncate">{lead.list_name || 'General Leads'}</span>
                              <ChevronDown className="w-3 h-3 stroke-[3]" />
                            </button>

                            {/* Dropdown Menu to change list */}
                            {activeChangeListLeadId === lead.id && (
                              <div className="absolute left-0 top-full mt-1.5 z-30 w-44 bg-white text-black border-2 border-black rounded-xl p-1.5 shadow-[4px_4px_0px_0px_#000]">
                                <p className="text-[10px] font-black uppercase text-slate-500 px-2 py-1">Move to List:</p>
                                {availableLists.map(l => (
                                  <button
                                    key={l}
                                    onClick={() => handleListChange(lead, l)}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#FFE600] flex items-center justify-between ${
                                      (lead.list_name || 'General Leads') === l ? 'bg-slate-100 font-black' : ''
                                    }`}
                                  >
                                    <span className="truncate">{l}</span>
                                    {(lead.list_name || 'General Leads') === l && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Audit & Design Scores */}
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-1">
                            {lead.audit_score !== null && lead.audit_score !== undefined ? (
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_#000] inline-flex items-center justify-center w-fit ${
                                  lead.audit_score >= 75
                                    ? 'bg-[#00F59B] text-black'
                                    : lead.audit_score >= 50
                                    ? 'bg-[#FFE600] text-black'
                                    : 'bg-[#FB7185] text-black'
                                }`}
                              >
                                Score: {lead.audit_score}/100
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Un-audited</span>
                            )}

                            {lead.design_score !== null && lead.design_score !== undefined && (
                              <span className="text-[10px] font-black px-2 py-0.2 rounded-md bg-[#C084FC] text-black border border-black shadow-[1px_1px_0px_0px_#000] inline-flex items-center gap-1 w-fit">
                                <Sparkles className="w-2.5 h-2.5 stroke-[2.5]" />
                                Design: {lead.design_score}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Outreach Status Selector */}
                        <td className="p-3 align-top">
                          <div className="relative inline-block">
                            <select
                              value={lead.outreach_status}
                              onChange={(e) => handleStatusChange(lead, e.target.value as OutreachStatus)}
                              className={`text-[11px] font-black px-2.5 py-1 rounded-xl border-2 border-black appearance-none pr-6 cursor-pointer shadow-[2px_2px_0px_0px_#000] focus:outline-none ${statusConfig.bg} ${statusConfig.color}`}
                            >
                              {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(st => (
                                <option key={st} value={st} className="bg-white text-black font-bold">
                                  {STATUS_CONFIG[st].label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[3]" />
                          </div>
                        </td>

                        {/* Follow-Up Reminder */}
                        <td className="p-3 align-top">
                          <div className="relative">
                            <button
                              onClick={() => setActiveFollowUpLeadId(activeFollowUpLeadId === lead.id ? null : lead.id)}
                              className={`text-[11px] font-black px-2.5 py-1 rounded-xl border-2 border-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer ${
                                lead.follow_up_date
                                  ? isOverdue
                                    ? 'bg-[#FB7185] text-black animate-pulse'
                                    : 'bg-[#FFE600] text-black'
                                  : isLight
                                    ? 'bg-white hover:bg-slate-100 text-slate-700'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              <Calendar className="w-3 h-3 stroke-[2.5]" />
                              <span>
                                {lead.follow_up_date
                                  ? isOverdue
                                    ? `DUE: ${lead.follow_up_date}`
                                    : lead.follow_up_date
                                  : '+ Schedule'}
                              </span>
                            </button>

                            {/* Date Picker Popover */}
                            {activeFollowUpLeadId === lead.id && (
                              <div className="absolute left-0 top-full mt-1.5 z-30 p-2.5 bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] w-48">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Set Date:</p>
                                <input
                                  type="date"
                                  value={lead.follow_up_date || ''}
                                  onChange={(e) => handleDateChange(lead, e.target.value)}
                                  className="w-full bg-slate-100 border border-black rounded-lg px-2 py-1 text-xs font-bold mb-2 text-black"
                                />
                                <div className="grid grid-cols-3 gap-1">
                                  <button
                                    onClick={() => setQuickFollowUp(lead, 1)}
                                    className="neo-btn bg-[#FFE600] text-black text-[10px] font-black py-0.5"
                                  >
                                    +1d
                                  </button>
                                  <button
                                    onClick={() => setQuickFollowUp(lead, 3)}
                                    className="neo-btn bg-[#38BDF8] text-black text-[10px] font-black py-0.5"
                                  >
                                    +3d
                                  </button>
                                  <button
                                    onClick={() => setQuickFollowUp(lead, 7)}
                                    className="neo-btn bg-[#C084FC] text-black text-[10px] font-black py-0.5"
                                  >
                                    +1w
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Notes Preview / Popover */}
                        <td className="p-3 align-top">
                          <div className="relative">
                            <button
                              onClick={() => setActiveNotesLeadId(activeNotesLeadId === lead.id ? null : lead.id)}
                              className={`text-[11px] font-black px-2.5 py-1 rounded-xl border-2 border-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer max-w-[180px] truncate ${
                                lead.notes
                                  ? 'bg-[#00F59B]/20 text-[#00A86B] border-black'
                                  : isLight
                                    ? 'bg-white hover:bg-slate-100 text-slate-500'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                              }`}
                              title={lead.notes || 'Click to add notes'}
                            >
                              <MessageSquare className="w-3 h-3 shrink-0 stroke-[2.5]" />
                              <span className="truncate">{lead.notes || '+ Note'}</span>
                            </button>

                            {/* Notes Editor Popover */}
                            {activeNotesLeadId === lead.id && (
                              <div className="absolute right-0 top-full mt-1.5 z-30 p-3 bg-white text-black border-2 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] w-72">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-black uppercase text-slate-700">Outreach Notes</span>
                                  <button onClick={() => setActiveNotesLeadId(null)} className="p-0.5">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <textarea
                                  rows={3}
                                  value={lead.notes || ''}
                                  onChange={(e) => handleNotesChange(lead, e.target.value)}
                                  placeholder="e.g. Sent redesign pitch, spoke to manager..."
                                  className="w-full bg-slate-50 border-2 border-black rounded-xl p-2 text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] mb-2"
                                />
                                <button
                                  onClick={() => setActiveNotesLeadId(null)}
                                  className="w-full neo-btn bg-[#FFE600] text-black text-xs font-black py-1"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 align-top text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                onSelectBusinessForModal({
                                  id: lead.business_id,
                                  name: lead.name,
                                  phone: lead.phone,
                                  address: lead.address,
                                  website_url: lead.website_url,
                                  latitude: 0,
                                  longitude: 0,
                                  audit: lead.audit,
                                })
                              }
                              className="neo-btn bg-white hover:bg-slate-100 text-black text-[11px] font-black px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer whitespace-nowrap"
                              title="Inspect audit metrics & generate pitch"
                            >
                              Pitch
                            </button>

                            <button
                              onClick={() => onDeleteLead(lead.id)}
                              className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black p-1 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                              title="Delete lead"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CARD VIEW: REDESIGNED, STREAMLINED & COMPACT              */
          /* ========================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredLeads.map((lead) => {
              const isSelected = selectedIds.has(lead.id);
              const statusConfig = STATUS_CONFIG[lead.outreach_status] || STATUS_CONFIG.not_contacted;
              const domain = getCleanDomain(lead.website_url);
              const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) <= new Date();

              return (
                <div
                  key={lead.id}
                  className={`neo-card p-4 transition-all flex flex-col justify-between ${
                    isSelected
                      ? isLight ? 'bg-sky-50 border-2 border-black shadow-[4px_4px_0px_0px_#38BDF8]' : 'bg-[#38BDF8]/15 border-2 border-black shadow-[4px_4px_0px_0px_#38BDF8]'
                      : isLight ? 'bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000]' : 'bg-slate-900 border-2 border-black shadow-[3px_3px_0px_0px_#000]'
                  }`}
                >
                  {/* Top Card Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(lead.id)}
                          className="mt-0.5 w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-inherit truncate" title={lead.name}>
                            {lead.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {lead.website_url ? (
                              <a
                                href={lead.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#0284C7] hover:underline font-black rounded border border-black text-[10px]"
                                title={lead.website_url}
                              >
                                <Globe className="w-2.5 h-2.5" />
                                <span className="max-w-[110px] truncate">{domain}</span>
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            ) : (
                              <span className="text-[#FB7185] font-black text-[9px] uppercase">No Web</span>
                            )}

                            {/* List Badge */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-black font-black rounded border border-black text-[10px]">
                              <Folder className="w-2.5 h-2.5 text-amber-600" />
                              <span className="max-w-[80px] truncate">{lead.list_name || 'General Leads'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative shrink-0">
                        <select
                          value={lead.outreach_status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as OutreachStatus)}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border-2 border-black appearance-none pr-5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000] focus:outline-none ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(st => (
                            <option key={st} value={st} className="bg-white text-black font-bold">
                              {STATUS_CONFIG[st].label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none stroke-[3]" />
                      </div>
                    </div>

                    {/* Scores & Contact Details */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-xs">
                      {lead.audit_score !== null && lead.audit_score !== undefined && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000] ${
                            lead.audit_score >= 75
                              ? 'bg-[#00F59B] text-black'
                              : lead.audit_score >= 50
                              ? 'bg-[#FFE600] text-black'
                              : 'bg-[#FB7185] text-black'
                          }`}
                        >
                          Score: {lead.audit_score}/100
                        </span>
                      )}
                      {lead.design_score !== null && lead.design_score !== undefined && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#C084FC] text-black border border-black shadow-[1px_1px_0px_0px_#000] flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Design: {lead.design_score}
                        </span>
                      )}
                      {lead.phone && lead.phone !== 'Not listed' && (
                        <a href={`tel:${lead.phone}`} className="text-[10px] font-bold text-slate-500 hover:text-black flex items-center gap-1 ml-auto">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{lead.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Notes Preview / Inline Toggle */}
                    <div className="mb-2">
                      {activeNotesLeadId === lead.id ? (
                        <div className="p-2 bg-slate-50 text-black border border-black rounded-xl mb-1.5">
                          <textarea
                            rows={2}
                            value={lead.notes || ''}
                            onChange={(e) => handleNotesChange(lead, e.target.value)}
                            placeholder="Add notes..."
                            className="w-full bg-transparent text-xs font-bold text-black focus:outline-none"
                          />
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setActiveNotesLeadId(null)}
                              className="neo-btn bg-[#FFE600] text-black text-[10px] font-black px-2 py-0.5"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveNotesLeadId(lead.id)}
                          className={`p-2 rounded-xl border border-black/30 cursor-pointer text-xs font-semibold truncate ${
                            lead.notes
                              ? isLight ? 'bg-amber-50/70 text-slate-800' : 'bg-slate-800 text-slate-200'
                              : isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-slate-500'
                          }`}
                        >
                          {lead.notes ? `📝 ${lead.notes}` : '+ Click to add notes...'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Follow-up & Actions */}
                  <div className="pt-2 border-t border-black/20 flex items-center justify-between gap-2">
                    {/* Quick Follow-Up badge */}
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={lead.follow_up_date || ''}
                        onChange={(e) => handleDateChange(lead, e.target.value)}
                        className={`text-[10px] font-bold border border-black rounded px-1.5 py-0.5 focus:outline-none ${
                          lead.follow_up_date
                            ? isOverdue
                              ? 'bg-[#FB7185] text-black'
                              : 'bg-[#FFE600] text-black'
                            : 'bg-white text-black'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onSelectBusinessForModal({
                            id: lead.business_id,
                            name: lead.name,
                            phone: lead.phone,
                            address: lead.address,
                            website_url: lead.website_url,
                            latitude: 0,
                            longitude: 0,
                            audit: lead.audit,
                          })
                        }
                        className="neo-btn bg-white hover:bg-slate-100 text-black text-[11px] font-black px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        Audit / Pitch
                      </button>

                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black p-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
