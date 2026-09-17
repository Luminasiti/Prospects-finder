'use client';

import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  FolderPlus, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Check, 
  Plus, 
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { SavedLead, OutreachStatus } from '@/lib/types';

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (newLead: SavedLead, shouldAudit?: boolean) => Promise<void>;
  availableLists: string[];
  currentList?: string;
  theme?: 'dark' | 'light';
}

const STATUS_OPTIONS: { value: OutreachStatus; label: string }[] = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted 📨' },
  { value: 'follow_up_needed', label: 'Follow-Up Needed ⏰' },
  { value: 'replied', label: 'Replied 💬' },
  { value: 'meeting_booked', label: 'Meeting Booked 📅' },
  { value: 'closed_deal', label: 'Closed Deal 🏆' },
  { value: 'lost', label: 'Lost / Passed ❌' },
];

export const AddProspectModal: React.FC<AddProspectModalProps> = ({
  isOpen,
  onClose,
  onSaveLead,
  availableLists,
  currentList,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const defaultList = (currentList && currentList !== 'all') ? currentList : (availableLists[0] || 'General Leads');

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedList, setSelectedList] = useState(defaultList);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [status, setStatus] = useState<OutreachStatus>('not_contacted');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoAudit, setAutoAudit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Business / Prospect name is required.');
      return;
    }

    let cleanWebsite = websiteUrl.trim();
    if (cleanWebsite && !cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
      cleanWebsite = `https://${cleanWebsite}`;
    }

    const listToUse = isCreatingList && newListName.trim() ? newListName.trim() : (selectedList || 'General Leads');

    const newLead: SavedLead = {
      id: crypto.randomUUID(),
      business_id: crypto.randomUUID(),
      name: cleanName,
      phone: phone.trim() || 'Not listed',
      address: address.trim() || 'Custom entry',
      website_url: cleanWebsite || null,
      audit_score: null,
      design_score: null,
      outreach_status: status,
      list_name: listToUse,
      follow_up_date: followUpDate || null,
      notes: notes.trim() || '',
      custom_fields: { list_name: listToUse },
      saved_at: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);
      await onSaveLead(newLead, autoAudit && Boolean(cleanWebsite));
      onClose();
      // Reset
      setName('');
      setWebsiteUrl('');
      setPhone('');
      setAddress('');
      setNotes('');
      setFollowUpDate('');
      setNewListName('');
      setIsCreatingList(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allLists = Array.from(new Set(['General Leads', ...availableLists]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-lg border-3 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] relative max-h-[92vh] overflow-y-auto ${
          isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Add Prospect Manually</span>
            </h2>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Insert a lead directly into your CRM database and organize into lists.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FB7185] text-black border-2 border-black rounded-xl text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
            <AlertCircle className="w-4 h-4 stroke-[3] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Company / Business Name <span className="text-[#FB7185]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Plumbing, Camping Center, Villa Rosa Hotel..."
                className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFE600]"
              />
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Website URL (optional)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="e.g. acmeplumbing.com, www.hotelvillarosa.it"
                className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#38BDF8]"
              />
            </div>
          </div>

          {/* Phone & Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +39 045 123456"
                  className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Location / Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Peschiera del Garda, Italy"
                  className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Target List Selection */}
          <div>
            <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Save to CRM List:
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allLists.map((list) => {
                const isSelected = !isCreatingList && selectedList === list;
                return (
                  <button
                    key={list}
                    type="button"
                    onClick={() => {
                      setSelectedList(list);
                      setIsCreatingList(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#FFE600] text-black shadow-[2.5px_2.5px_0px_0px_#000] scale-[1.02]'
                        : isLight
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_#000]'
                          : 'bg-slate-800 text-slate-300 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{list}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreatingList(true)}
                className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                  isCreatingList
                    ? 'bg-[#38BDF8] text-black shadow-[2.5px_2.5px_0px_0px_#000]'
                    : isLight
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300 shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'bg-slate-800 text-slate-200 hover:text-white shadow-[1.5px_1.5px_0px_0px_#000]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ New List</span>
              </button>
            </div>

            {isCreatingList && (
              <div className="mt-2">
                <input
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter new list name..."
                  className="w-full bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-bold text-black placeholder-slate-400 shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Outreach Status & Follow-up Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Initial Outreach Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OutreachStatus)}
                className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-black shadow-[3px_3px_0px_0px_#000] focus:outline-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Follow-Up Reminder
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-black shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-xs font-black uppercase mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Initial Notes / Outreach Log
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met owner at Lake Garda conference, needs redesign for mobile CRO..."
              className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none"
            />
          </div>

          {/* Auto-Audit Option */}
          {websiteUrl.trim() && (
            <div className={`p-3 border-2 border-black rounded-xl flex items-center gap-2.5 ${
              isLight ? 'bg-amber-50' : 'bg-slate-800'
            }`}>
              <input
                type="checkbox"
                id="autoAuditCheckbox"
                checked={autoAudit}
                onChange={(e) => setAutoAudit(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-black bg-white accent-black cursor-pointer"
              />
              <label htmlFor="autoAuditCheckbox" className="text-xs font-black text-inherit cursor-pointer flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#FFE600] text-black" />
                <span>Trigger instant PageSpeed & AI design audit for this website</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="neo-btn bg-white hover:bg-slate-100 text-black text-xs font-black px-4 py-2 shadow-[2.5px_2.5px_0px_0px_#000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="neo-btn bg-[#00F59B] hover:bg-[#00E58F] disabled:opacity-50 text-black text-xs font-black px-5 py-2 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Insert Prospect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
