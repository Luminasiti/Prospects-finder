'use client';

import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Zap, 
  Loader2, 
  Building2, 
  Tag, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Business } from '@/lib/types';

interface SingleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditSingle: (business: Business) => Promise<void>;
  isAuditing: boolean;
  theme?: 'dark' | 'light';
}

export const SingleAuditModal: React.FC<SingleAuditModalProps> = ({
  isOpen,
  onClose,
  onAuditSingle,
  isAuditing,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Local Business');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Website URL is required.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const businessName = name.trim() || cleanUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

    const tempBusiness: Business = {
      id: crypto.randomUUID(),
      name: businessName,
      website_url: cleanUrl,
      phone: phone.trim() || 'Not listed',
      address: address.trim() || 'Custom audit target',
      latitude: 45.5855,
      longitude: 10.6500,
      status: 'pending_audit',
    };

    try {
      await onAuditSingle(tempBusiness);
      onClose();
      setUrl('');
      setName('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to audit website');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`relative w-full max-w-lg border-3 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] overflow-hidden flex flex-col ${
        isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b-2 border-black flex items-center justify-between ${
          isLight ? 'bg-slate-100' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            <div>
              <h3 className="font-black text-base text-inherit">AUDIT SINGLE WEBSITE</h3>
              <p className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Run instant technical audit & AI design critique for any URL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="neo-btn bg-white hover:bg-slate-100 text-black p-1.5 shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-200">
          {error && (
            <div className="p-3 bg-[#FB7185] text-black border-2 border-black rounded-xl text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
              <AlertTriangle className="w-4 h-4 stroke-[3] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
              Website URL *
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com or domain.com"
                className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFE600]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                Business Name (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Apex Plumbing"
                  className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[2.5px_2.5px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                Niche / Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Plumber, Dentist..."
                  className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-black placeholder-slate-400 shadow-[2.5px_2.5px_0px_0px_#000] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuditing}
            className="w-full mt-2 neo-btn bg-[#FFE600] hover:bg-[#FACC15] disabled:opacity-50 text-black py-3 rounded-xl text-xs font-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-2"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                <span>RUNNING AUDIT & AI CRITIC...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black text-black" />
                <span>RUN INSTANT AUDIT</span>
                <Sparkles className="w-3.5 h-3.5 text-black" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
