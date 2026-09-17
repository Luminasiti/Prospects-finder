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
  Filter
} from 'lucide-react';

interface ProspectsCrmViewProps {
  savedLeads: SavedLead[];
  onUpdateLead: (updatedLead: SavedLead) => void;
  onDeleteLead: (leadId: string) => void;
  onSelectBusinessForModal: (business: Business) => void;
  onExportCsv: (leadsToExport: SavedLead[]) => void;
  isExporting: boolean;
}

const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; bg: string; border: string }> = {
  not_contacted: { label: 'Not Contacted', color: 'text-black', bg: 'bg-white', border: 'border-black' },
  contacted: { label: 'Contacted 📨', color: 'text-black', bg: 'bg-[#38BDF8]', border: 'border-black' },
  follow_up_needed: { label: 'Follow-Up Needed ⏰', color: 'text-black', bg: 'bg-[#FFE600]', border: 'border-black' },
  replied: { label: 'Replied 💬', color: 'text-black', bg: 'bg-[#00F59B]', border: 'border-black' },
  meeting_booked: { label: 'Meeting Booked 📅', color: 'text-black', bg: 'bg-[#C084FC]', border: 'border-black' },
  closed_deal: { label: 'Closed Deal 🏆', color: 'text-black', bg: 'bg-[#4ADE80]', border: 'border-black' },
  lost: { label: 'Lost / Passed ❌', color: 'text-white', bg: 'bg-[#FB7185]', border: 'border-black' },
};

export const ProspectsCrmView: React.FC<ProspectsCrmViewProps> = ({
  savedLeads,
  onUpdateLead,
  onDeleteLead,
  onSelectBusinessForModal,
  onExportCsv,
  isExporting,
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [addingCustomFieldLeadId, setAddingCustomFieldLeadId] = useState<string | null>(null);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: savedLeads.length };
    Object.keys(STATUS_CONFIG).forEach(k => { counts[k] = 0; });
    savedLeads.forEach(l => {
      const st = l.outreach_status || 'not_contacted';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [savedLeads]);

  const filteredLeads = useMemo(() => {
    let list = [...savedLeads];

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
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [savedLeads, activeStatusFilter, searchQuery]);

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

  const handleDateChange = (lead: SavedLead, dateStr: string) => {
    onUpdateLead({
      ...lead,
      follow_up_date: dateStr || null,
      updated_at: new Date().toISOString(),
    });
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
    const currentFields = { ...(lead.custom_fields || {}) };
    currentFields[customFieldKey.trim()] = customFieldValue.trim();

    onUpdateLead({
      ...lead,
      custom_fields: currentFields,
      updated_at: new Date().toISOString(),
    });

    setAddingCustomFieldLeadId(null);
    setCustomFieldKey('');
    setCustomFieldValue('');
  };

  const handleRemoveCustomField = (lead: SavedLead, keyToRemove: string) => {
    const currentFields = { ...(lead.custom_fields || {}) };
    delete currentFields[keyToRemove];

    onUpdateLead({
      ...lead,
      custom_fields: currentFields,
      updated_at: new Date().toISOString(),
    });
  };

  const setQuickFollowUp = (lead: SavedLead, days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    handleDateChange(lead, dateStr);
  };

  const leadsForExport = selectedIds.size > 0
    ? savedLeads.filter(l => selectedIds.has(l.id))
    : filteredLeads;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b-2 border-black bg-slate-900 flex flex-wrap items-center justify-between gap-4 shadow-[0px_3px_0px_0px_#000]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FFE600] stroke-[2.5]" />
            <span>SAVED PROSPECTS CRM DATABASE</span>
            <span className="text-xs font-black bg-[#FFE600] text-black px-3 py-0.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              {savedLeads.length} CLIENTS
            </span>
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            Track outreach stages, set follow-up reminders, write conversation logs, and manage custom client attributes.
          </p>
        </div>

        {/* Action Buttons: Export CSV & Bulk operations */}
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-xs font-black text-black bg-[#FFE600] border-2 border-black px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000]">
              {selectedIds.size} SELECTED
            </span>
          )}

          <button
            onClick={() => onExportCsv(leadsForExport)}
            disabled={isExporting || leadsForExport.length === 0}
            className="neo-btn flex items-center gap-1.5 bg-[#00F59B] hover:bg-[#00E58F] disabled:opacity-50 text-black text-xs font-black px-4 py-2 shadow-[3px_3px_0px_0px_#000]"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>
              {selectedIds.size > 0
                ? `EXPORT SELECTED (${selectedIds.size})`
                : `EXPORT CRM CSV (${filteredLeads.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="p-3 border-b-2 border-black bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer ${
              activeStatusFilter === 'all'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            ALL ({statusCounts.all})
          </button>

          {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(st => {
            const conf = STATUS_CONFIG[st];
            const isAct = activeStatusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all border-2 border-black cursor-pointer flex items-center gap-1.5 ${
                  isAct
                    ? `${conf.bg} ${conf.color} shadow-[2.5px_2.5px_0px_0px_#000] ring-1 ring-white/50`
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

        {/* Search & Select All */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prospects & notes..."
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

      {/* Main CRM Cards / List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900 border-2 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000]">
            <Users className="w-12 h-12 text-[#FFE600] mx-auto mb-3 stroke-[2.5]" />
            <h3 className="text-lg font-black text-white">NO PROSPECTS IN THIS VIEW</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto">
              Go to the <strong>Map & Search</strong> tab, discover businesses, check their boxes, and click <strong>&quot;Save to CRM List&quot;</strong>.
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isSelected = selectedIds.has(lead.id);
            const statusConfig = STATUS_CONFIG[lead.outreach_status] || STATUS_CONFIG.not_contacted;
            const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) <= new Date();

            return (
              <div
                key={lead.id}
                className={`neo-card p-4 transition-all ${
                  isSelected
                    ? 'border-2 border-black bg-[#38BDF8]/20 shadow-[5px_5px_0px_0px_#38BDF8]'
                    : 'bg-slate-900 border-2 border-black shadow-[4px_4px_0px_0px_#000]'
                }`}
              >
                {/* Header Row: Checkbox, Business Info, Scores & Status Selector */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(lead.id)}
                      className="mt-1 w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-white">{lead.name}</h3>
                        {lead.audit_score !== null && lead.audit_score !== undefined && (
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
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
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#C084FC] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 stroke-[2.5]" />
                            Design: {lead.design_score}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 font-semibold">
                        <span>📍 {lead.address}</span>
                        <a href={`tel:${lead.phone}`} className="text-slate-200 hover:text-white flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 stroke-[2.5]" />
                          <span>{lead.phone}</span>
                        </a>
                        {lead.website_url ? (
                          <a
                            href={lead.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#38BDF8] hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3 stroke-[2.5]" />
                            <span>{lead.website_url}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[#FB7185] font-black">NO WEBSITE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outreach Status Selector & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={lead.outreach_status}
                        onChange={(e) => handleStatusChange(lead, e.target.value as OutreachStatus)}
                        className={`text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-black appearance-none pr-8 cursor-pointer shadow-[2.5px_2.5px_0px_0px_#000] focus:outline-none ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(st => (
                          <option key={st} value={st} className="bg-slate-900 text-white font-bold">
                            {STATUS_CONFIG[st].label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[3]" />
                    </div>

                    {/* View Audit Modal Button */}
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
                      className="neo-btn bg-white hover:bg-slate-100 text-black text-xs font-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]"
                    >
                      Audit / Pitch
                    </button>

                    {/* Delete Lead Button */}
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black p-1.5 shadow-[2px_2px_0px_0px_#000]"
                      title="Delete lead from CRM list"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Second Row: Follow-Up Schedule & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t-2 border-black">
                  {/* Left Column: Follow-up Date */}
                  <div className="bg-black/60 border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-[#FFE600] stroke-[2.5]" />
                        <span>FOLLOW-UP REMINDER:</span>
                      </div>
                      {isOverdue && (
                        <span className="text-[10px] font-black text-black bg-[#FB7185] px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] animate-pulse">
                          DUE NOW!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={lead.follow_up_date || ''}
                        onChange={(e) => handleDateChange(lead, e.target.value)}
                        className="bg-white border-2 border-black text-xs font-bold text-black rounded-xl px-2.5 py-1 focus:outline-none flex-1 shadow-[2px_2px_0px_0px_#000]"
                      />

                      <button
                        onClick={() => setQuickFollowUp(lead, 1)}
                        className="neo-btn bg-[#FFE600] text-black text-xs font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                        title="Follow up tomorrow"
                      >
                        +1d
                      </button>
                      <button
                        onClick={() => setQuickFollowUp(lead, 3)}
                        className="neo-btn bg-[#38BDF8] text-black text-xs font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                        title="Follow up in 3 days"
                      >
                        +3d
                      </button>
                      <button
                        onClick={() => setQuickFollowUp(lead, 7)}
                        className="neo-btn bg-[#C084FC] text-black text-xs font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                        title="Follow up next week"
                      >
                        +1w
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Outreach Notes */}
                  <div className="bg-black/60 border-2 border-black rounded-xl p-3 flex flex-col shadow-[2px_2px_0px_0px_#000]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#38BDF8] stroke-[2.5]" />
                      <span>OUTREACH LOG & NOTES:</span>
                    </div>
                    <textarea
                      value={lead.notes || ''}
                      onChange={(e) => handleNotesChange(lead, e.target.value)}
                      placeholder="e.g. Called owner Mike, asked for mockup sent via WhatsApp, follow up Friday..."
                      rows={2}
                      className="w-full bg-white border-2 border-black rounded-xl p-2 text-xs font-bold text-black placeholder-slate-500 focus:outline-none resize-none flex-1 shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                </div>

                {/* Third Row: Custom Fields */}
                <div className="mt-3 pt-3 border-t-2 border-black flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-300 font-black uppercase flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#C084FC] stroke-[2.5]" />
                    <span>Custom Fields:</span>
                  </span>

                  {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 ? (
                    Object.entries(lead.custom_fields).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 bg-[#C084FC] text-black border-2 border-black px-2.5 py-0.5 rounded-xl text-xs font-black shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        <strong className="font-black underline">{k}:</strong>
                        <span>{v}</span>
                        <button
                          onClick={() => handleRemoveCustomField(lead, k)}
                          className="text-black hover:text-rose-900 ml-1 font-black"
                          title="Remove custom field"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic font-medium">No custom fields attached.</span>
                  )}

                  {addingCustomFieldLeadId === lead.id ? (
                    <div className="flex items-center gap-1.5 bg-black border-2 border-black p-1 rounded-xl shadow-[2px_2px_0px_0px_#000]">
                      <input
                        type="text"
                        placeholder="Field (e.g. Owner)"
                        value={customFieldKey}
                        onChange={(e) => setCustomFieldKey(e.target.value)}
                        className="bg-white border-2 border-black text-xs font-bold text-black rounded-lg px-2 py-1 w-28 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. John Doe)"
                        value={customFieldValue}
                        onChange={(e) => setCustomFieldValue(e.target.value)}
                        className="bg-white border-2 border-black text-xs font-bold text-black rounded-lg px-2 py-1 w-36 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomField(lead);
                        }}
                      />
                      <button
                        onClick={() => handleAddCustomField(lead)}
                        className="neo-btn bg-[#00F59B] text-black p-1 text-xs shadow-[1.5px_1.5px_0px_0px_#000]"
                        title="Save Field"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setAddingCustomFieldLeadId(null)}
                        className="text-white hover:text-slate-300 p-1"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingCustomFieldLeadId(lead.id);
                        setCustomFieldKey('');
                        setCustomFieldValue('');
                      }}
                      className="neo-btn text-xs font-black text-black bg-[#FFE600] hover:bg-[#FACC15] px-2.5 py-0.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>+ Custom Field</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
