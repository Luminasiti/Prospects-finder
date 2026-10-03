'use client';

import React from 'react';
import { 
  Search, 
  CircleDot, 
  Pentagon, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  Loader2, 
  SlidersHorizontal,
  Globe,
  ChevronDown
} from 'lucide-react';
import { SearchBounds } from '@/lib/types';

interface ControlBarProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  bounds: SearchBounds;
  onBoundsChange: (b: SearchBounds) => void;
  onFindLeads: () => void;
  onRunAudit: () => void;
  isSearching: boolean;
  isAuditing: boolean;
  auditProgress: { current: number; total: number } | null;
  leadCount: number;
  onOpenSingleAuditModal?: () => void;
  theme?: 'dark' | 'light';
  resultsLimit?: number;
  onResultsLimitChange?: (limit: number) => void;
}

export const POPULAR_NICHE_GROUPS = [
  {
    group: '🍽️ Food, Drink & Hospitality',
    niches: [
      'Restaurant',
      'Pizzeria',
      'Hotel',
      'Agriturismo',
      'Bed & Breakfast',
      'Bar & Cafeteria',
      'Bakery / Pasticceria',
      'Catering Service',
      'Wine Bar / Enoteca',
      'Gelateria',
    ],
  },
  {
    group: '🏥 Health, Medical & Wellness',
    niches: [
      'Dentist',
      'Medical Clinic / Poliambulatorio',
      'Physiotherapist / Fisioterapia',
      'Veterinarian / Veterinaria',
      'Pharmacy / Farmacia',
      'Chiropractor',
      'Psychologist / Psicologia',
      'Optician / Ottico',
      'Hair Salon / Parrucchiere',
      'Barbershop / Barbiere',
      'Beauty Salon & Spa / Estetica',
      'Gym & Fitness Studio / Palestra',
    ],
  },
  {
    group: '🔨 Home, Trades & Construction',
    niches: [
      'Plumber / Idraulico',
      'Electrician / Elettricista',
      'HVAC Contractor / Caldaie & Clima',
      'Roofer / Coperture & Tetti',
      'General Contractor / Impresa Edile',
      'Painter / Imbianchino',
      'Carpenter / Falegname',
      'Locksmith / Fabbro',
      'Cleaning Company / Pulizie',
      'Landscaper / Giardiniere',
      'Solar & Energy Solutions / Fotovoltaico',
      'Pest Control / Disinfestazione',
      'Windows & Doors / Infissi & Serramenti',
    ],
  },
  {
    group: '🚗 Automotive & Marine',
    niches: [
      'Auto Repair / Meccanico & Officina',
      'Car Dealership / Concessionaria',
      'Auto Body Shop / Carrozzeria',
      'Tire Shop / Gommista',
      'Car Wash & Detailing / Autolavaggio',
      'Motorcycle Repair / Moto Officina',
      'Car Rental / Noleggio Auto',
      'Boat Rental / Noleggio Barche',
    ],
  },
  {
    group: '⚖️ Legal, Finance & Professional',
    niches: [
      'Lawyer / Studio Legale',
      'Accountant / Commercialista',
      'Real Estate Agency / Agenzia Immobiliare',
      'Insurance Agency / Assicurazioni',
      'Notary / Studio Notarile',
      'Architect / Studio Architettura',
      'Financial Advisor / Consulente Finanziario',
      'Marketing & Web Agency',
      'Photographer & Studio',
    ],
  },
  {
    group: '🛍️ Retail, Leisure & Services',
    niches: [
      'Boutique / Abbigliamento',
      'Jewelry Store / Gioielleria',
      'Pet Shop & Grooming / Toelettatura',
      'Furniture Store / Arredamento',
      'Bike Rental & Shop / Noleggio Bici',
      'Event & Wedding Planner',
      'Tattoo & Piercing Studio',
    ],
  },
];

const QUICK_SHORTCUTS = [
  'Restaurant',
  'Hotel',
  'Dentist',
  'Plumber',
  'Lawyer',
  'Auto Repair',
  'Impresa Edile',
];

export const ControlBar: React.FC<ControlBarProps> = ({
  category,
  onCategoryChange,
  bounds,
  onBoundsChange,
  onFindLeads,
  onRunAudit,
  isSearching,
  isAuditing,
  auditProgress,
  leadCount,
  onOpenSingleAuditModal,
  theme = 'dark',
  resultsLimit = 20,
  onResultsLimitChange,
}) => {
  const isLight = theme === 'light';
  const isRadius = bounds.type === 'radius';

  const handleToolToggle = (type: 'radius' | 'polygon') => {
    if (type === 'radius') {
      onBoundsChange({
        ...bounds,
        type: 'radius',
        radius: bounds.radius || 3000,
      });
    } else {
      onBoundsChange({
        ...bounds,
        type: 'polygon',
        polygon: bounds.polygon || [],
      });
    }
  };

  const handleClear = () => {
    if (isRadius) {
      onBoundsChange({
        ...bounds,
        radius: 3000,
      });
    } else {
      onBoundsChange({
        ...bounds,
        polygon: [],
      });
    }
  };

  return (
    <div className={`border-b-2 border-black px-6 py-3 flex flex-col gap-3 shadow-[0px_3px_0px_0px_#000] transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
    }`}>
      {/* Top Row: Category Input, Draw Controls & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Niche / Keyword input */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="Enter niche (e.g. Plumber, Dentist, Restaurant)..."
              className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-black placeholder-slate-500 shadow-[3px_3px_0px_0px_#000] focus:shadow-[4px_4px_0px_0px_#FFE600] focus:outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearching && !isAuditing) {
                  onFindLeads();
                }
              }}
            />
          </div>
        </div>

        {/* Map Drawing Controls */}
        <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000]">
          <button
            type="button"
            onClick={() => handleToolToggle('radius')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isRadius
                ? 'bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Circle Radius Tool: Click map to center search circle"
          >
            <CircleDot className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Radius Tool</span>
          </button>

          <button
            type="button"
            onClick={() => handleToolToggle('polygon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              !isRadius
                ? 'bg-[#38BDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Polygon Boundary Tool: Click multiple points on map to draw search zone"
          >
            <Pentagon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Polygon Tool {bounds.polygon && bounds.polygon.length > 0 ? `(${bounds.polygon.length} pts)` : ''}</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-[#FB7185] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Clear Drawn Area"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Radius distance adjustment slider (if radius mode active) */}
        {isRadius && (
          <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-xl text-xs font-bold text-black shadow-[2.5px_2.5px_0px_0px_#000]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
            <span>Radius:</span>
            <span className="font-black text-blue-600 min-w-[3rem]">
              {((bounds.radius || 3000) / 1000).toFixed(1)} km
            </span>
            <input
              type="range"
              min="500"
              max="15000"
              step="500"
              value={bounds.radius || 3000}
              onChange={(e) =>
                onBoundsChange({ ...bounds, radius: Number(e.target.value) })
              }
              className="w-24 accent-black cursor-pointer"
            />
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Results Limit Selector */}
          <div className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1.5 rounded-xl text-xs font-bold text-black shadow-[2.5px_2.5px_0px_0px_#000]">
            <span className="text-[11px] font-black uppercase text-slate-600">Limit:</span>
            <select
              value={resultsLimit}
              onChange={(e) => onResultsLimitChange?.(Number(e.target.value))}
              disabled={isSearching || isAuditing}
              className="bg-transparent font-black text-xs text-black focus:outline-none cursor-pointer pr-1"
              title="Select how many leads to discover"
            >
              <option value={15}>15 Leads</option>
              <option value={20}>20 Leads</option>
              <option value={40}>40 Leads</option>
              <option value={60}>60 Leads</option>
            </select>
          </div>

          {/* Discover Leads in Zone */}
          <button
            onClick={() => onFindLeads()}
            disabled={isSearching || isAuditing}
            className="neo-btn flex items-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-black px-4 py-2 text-xs font-black shadow-[3px_3px_0px_0px_#000]"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Scanning Zone...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Find Businesses</span>
              </>
            )}
          </button>

          {/* Run Full Automated Audit & AI Critic */}
          <button
            onClick={onRunAudit}
            disabled={isAuditing || leadCount === 0}
            className={`neo-btn flex items-center gap-2 px-5 py-2 text-xs font-black transition-all ${
              leadCount === 0
                ? 'bg-slate-800 text-slate-500 border-2 border-black cursor-not-allowed shadow-none'
                : isAuditing
                ? 'bg-[#C084FC] text-black animate-pulse shadow-[3px_3px_0px_0px_#000]'
                : 'bg-[#FFE600] hover:bg-[#FACC15] text-black shadow-[3.5px_3.5px_0px_0px_#000]'
            }`}
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black stroke-[3]" />
                <span>
                  {auditProgress
                    ? `Auditing ${auditProgress.current}/${auditProgress.total}...`
                    : 'Auditing & AI Critic...'}
                </span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black text-black" />
                <span>Run Audit Scan {leadCount > 0 ? `(${leadCount})` : ''}</span>
                <Sparkles className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
              </>
            )}
          </button>

          {/* Singular Custom URL Audit Button */}
          {onOpenSingleAuditModal && (
            <button
              onClick={onOpenSingleAuditModal}
              className="neo-btn flex items-center gap-1.5 bg-[#C084FC] hover:bg-purple-400 text-black px-3.5 py-2 text-xs font-black shadow-[3px_3px_0px_0px_#000] cursor-pointer"
              title="Audit any specific website URL"
            >
              <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Single Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Popular Niches Drop Box & Quick Shortcuts */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-wrap sm:flex-nowrap">
        {/* Popular Drop Box */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label className={`${isLight ? 'text-slate-800' : 'text-slate-200'} text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0`}>
            <Sparkles className="w-3.5 h-3.5 text-[#FFE600] fill-[#FFE600]" />
            <span>Popular:</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value) onCategoryChange(e.target.value);
              }}
              className="bg-white border-2 border-black text-black font-black text-xs rounded-xl pl-3 pr-8 py-1.5 shadow-[2.5px_2.5px_0px_0px_#000] focus:shadow-[3.5px_3.5px_0px_0px_#FFE600] focus:outline-none cursor-pointer appearance-none min-w-[210px]"
              title="Select from 50+ popular business niches"
            >
              <option value="" disabled>
                -- Choose from 55+ Niches --
              </option>
              {POPULAR_NICHE_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group} className="font-black text-slate-900 bg-slate-100">
                  {group.niches.map((niche) => (
                    <option key={niche} value={niche} className="font-bold text-black bg-white">
                      {niche}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-black absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[3]" />
          </div>
        </div>

        {/* Quick shortcut pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-4 w-[2px] bg-black/20 shrink-0 mx-0.5 hidden sm:block" />
          <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-black uppercase shrink-0 hidden md:inline`}>
            Quick:
          </span>
          {QUICK_SHORTCUTS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-xl shrink-0 transition-all font-black text-[11px] cursor-pointer border-2 border-black ${
                category.toLowerCase() === cat.toLowerCase()
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                  : isLight
                    ? 'bg-white text-slate-800 hover:bg-slate-100 shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-[1.5px_1.5px_0px_0px_#000]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={`ml-auto ${isLight ? 'text-slate-700' : 'text-slate-400'} text-[11px] font-bold hidden xl:block shrink-0`}>
          {isRadius ? (
            <span>💡 <strong>Radius:</strong> Click map to reposition search zone</span>
          ) : (
            <span>💡 <strong>Polygon:</strong> Click points on map to enclose zone</span>
          )}
        </div>
      </div>
    </div>
  );
};
