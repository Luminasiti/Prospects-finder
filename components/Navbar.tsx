'use client';

import React from 'react';
import { 
  Radar, 
  Settings, 
  Sparkles, 
  Database, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Map,
  Zap,
  LogOut,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  leadCount: number;
  redesignCount: number;
  savedLeadsCount: number;
  isAuditing: boolean;
  activeView: 'map' | 'crm';
  onViewChange: (view: 'map' | 'crm') => void;
  userEmail?: string | null;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  leadCount,
  redesignCount,
  savedLeadsCount,
  isAuditing,
  activeView,
  onViewChange,
  userEmail,
  onLogout,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header className={`h-16 border-b-2 border-black px-6 flex items-center justify-between sticky top-0 z-40 transition-colors ${
      isLight ? 'bg-white text-slate-900 shadow-[0px_3px_0px_0px_#000]' : 'bg-slate-950 text-white shadow-[0px_4px_0px_0px_#000]'
    }`}>
      {/* Brand Logo & View Switcher */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFE600] border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] flex items-center justify-center">
            <Radar className={`w-5 h-5 text-black ${isAuditing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl text-inherit tracking-tight flex items-center gap-1">
                PROSPECT<span className="text-[#FFE600] bg-black px-1.5 py-0.2 rounded border border-[#FFE600]">PULSE</span>
              </h1>
              <span className="text-[10px] uppercase font-black tracking-wider bg-[#00F59B] text-black px-2 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                AI AUDIT + CRM
              </span>
            </div>
            <p className={`text-[11px] font-bold hidden sm:block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Automated Lead Discovery & Modernization Engine
            </p>
          </div>
        </div>

        {/* View Switcher Tabs: Map vs CRM Database */}
        <div className={`flex items-center border-2 border-black p-1 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] ${
          isLight ? 'bg-slate-100' : 'bg-slate-900'
        }`}>
          <button
            onClick={() => onViewChange('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-[#38BDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Map & Search</span>
          </button>

          <button
            onClick={() => onViewChange('crm')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeView === 'crm'
                ? 'bg-[#C084FC] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                : isLight ? 'text-slate-700 hover:text-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>CRM Database</span>
            {savedLeadsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black border border-black ${
                activeView === 'crm' ? 'bg-black text-white' : 'bg-[#FFE600] text-black'
              }`}>
                {savedLeadsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Status Indicators, User Info, Theme Toggle & Settings */}
      <div className="hidden md:flex items-center gap-2.5">
        {activeView === 'map' && leadCount > 0 && (
          <div className={`flex items-center gap-3 text-xs border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] ${
            isLight ? 'bg-slate-100' : 'bg-slate-900'
          }`}>
            <div className="flex items-center gap-1.5 text-inherit font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span><strong>{leadCount}</strong> Discovered</span>
            </div>
            <div className="h-3 w-0.5 bg-black/20" />
            <div className="flex items-center gap-1.5 text-[#FB7185] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185]" />
              <span><strong>{redesignCount}</strong> Hot Leads</span>
            </div>
          </div>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="neo-btn flex items-center gap-1.5 text-xs bg-white text-black hover:bg-slate-100 px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 fill-slate-900 text-slate-900 stroke-[2.5]" />
                <span className="font-black">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 fill-[#FFE600] text-black stroke-[2.5]" />
                <span className="font-black">Light</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="neo-btn flex items-center gap-1.5 text-xs bg-white text-black hover:bg-slate-100 px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
          title="API Keys & Database Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Config</span>
        </button>

        {/* User Account Info & Logout */}
        {userEmail && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black bg-[#C084FC] text-black border-2 border-black px-2.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000]">
              <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="max-w-[130px] truncate">{userEmail}</span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="neo-btn bg-[#FB7185] hover:bg-rose-400 text-black p-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
