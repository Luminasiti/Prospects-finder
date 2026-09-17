'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { Navbar } from '@/components/Navbar';
import { ControlBar } from '@/components/ControlBar';
import { ResultsDrawer } from '@/components/ResultsDrawer';
import { ProspectsCrmView } from '@/components/ProspectsCrmView';
import { AuditDetailModal } from '@/components/AuditDetailModal';
import { SingleAuditModal } from '@/components/SingleAuditModal';
import { ConfigModal } from '@/components/ConfigModal';
import { LoginForm } from '@/components/LoginForm';
import { Business, SearchBounds, SavedLead } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Dynamically import MapComponent to disable SSR
const MapComponent = dynamic(
  () => import('@/components/MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center animate-spin">
          <Loader2 className="w-5 h-5 text-black" />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-white">Loading Interactive Map...</p>
      </div>
    ),
  }
);

const LOCAL_STORAGE_SAVED_KEY = 'prospectpulse_saved_leads';

export default function HomePage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'map' | 'crm'>('map');
  const [category, setCategory] = useState('Plumber');
  const [bounds, setBounds] = useState<SearchBounds>({
    type: 'radius',
    center: { lat: 40.7128, lng: -74.006 }, // New York default center
    radius: 3000,
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSingleAuditModalOpen, setIsSingleAuditModalOpen] = useState(false);
  const [auditingLeadId, setAuditingLeadId] = useState<string | null>(null);

  // Set of saved business IDs for fast lookup
  const savedBusinessIds = useMemo(() => {
    return new Set(savedLeads.map(l => l.business_id));
  }, [savedLeads]);

  // Redesign count (<50)
  const redesignCount = useMemo(() => {
    return businesses.filter(
      (b) => b.website_url && b.audit?.score !== null && (b.audit?.score || 0) < 50
    ).length;
  }, [businesses]);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUserEmail(data.email || 'accounts@luminasiti.com');
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));

    // Load saved leads from localStorage & Supabase
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (cached) {
        setSavedLeads(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Error reading saved leads cache:', e);
    }

    fetch('/api/leads/saved')
      .then(res => res.json())
      .then(data => {
        if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          setSavedLeads(data.leads);
          localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(data.leads));
        }
      })
      .catch(err => console.warn('Supabase saved leads fetch:', err));

    // Load initial leads
    handleFindLeads();
  }, []);

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  const updateSavedLeadsState = (newLeads: SavedLead[]) => {
    setSavedLeads(newLeads);
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(newLeads));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleFindLeads = async () => {
    try {
      setIsSearching(true);
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, bounds }),
      });

      if (!res.ok) {
        throw new Error('Failed to discover leads in this zone.');
      }

      const data = await res.json();
      setBusinesses(data.businesses || []);
      setScanId(data.scanId || null);
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRunAudit = async () => {
    if (businesses.length === 0) {
      await handleFindLeads();
      return;
    }

    try {
      setIsAuditing(true);
      setAuditProgress({ current: 0, total: businesses.length });

      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businesses, scanId }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete website audits.');
      }

      const data = await res.json();
      if (data.businesses) {
        setBusinesses(data.businesses);

        if (selectedBusiness) {
          const updated = data.businesses.find((b: Business) => b.id === selectedBusiness.id);
          if (updated) setSelectedBusiness(updated);
        }

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Audit execution error:', err);
    } finally {
      setIsAuditing(false);
      setAuditProgress(null);
    }
  };

  const handleAuditSingleLead = async (business: Business) => {
    if (!business.website_url) return;
    try {
      setAuditingLeadId(business.id);
      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businesses: [business], scanId }),
      });

      if (!res.ok) throw new Error('Failed to audit lead');
      const data = await res.json();
      if (data.businesses && data.businesses.length > 0) {
        const audited: Business = data.businesses[0];
        setBusinesses((prev) => prev.map((b) => (b.id === audited.id ? audited : b)));
        if (selectedBusiness?.id === audited.id) {
          setSelectedBusiness(audited);
        }

        // Also sync with saved leads in state and database if this lead is already saved
        setSavedLeads((prev) =>
          prev.map((l) => {
            if (l.business_id === audited.id) {
              const updatedLead: SavedLead = {
                ...l,
                audit_score: audited.audit?.score ?? l.audit_score,
                design_score: audited.audit?.ai_critique?.design_score ?? l.design_score,
                audit: audited.audit || l.audit,
              };
              // Async sync to server
              fetch('/api/leads/saved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead: updatedLead }),
              }).catch(() => {});
              return updatedLead;
            }
            return l;
          })
        );

        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Single audit error:', err);
    } finally {
      setAuditingLeadId(null);
    }
  };

  const handleCustomSingleAudit = async (business: Business) => {
    // Add custom lead to businesses list
    setBusinesses((prev) => [business, ...prev.filter((b) => b.id !== business.id)]);
    // Select and open in inspector modal
    setSelectedBusiness(business);
    // Run the audit
    await handleAuditSingleLead(business);
  };

  const handleSaveToCrm = async (businessesToSave: Business[]) => {
    const newSavedItems: SavedLead[] = businessesToSave.map(b => {
      const existing = savedLeads.find(l => l.business_id === b.id);
      if (existing) {
        return {
          ...existing,
          audit_score: b.audit?.score ?? existing.audit_score,
          design_score: b.audit?.ai_critique?.design_score ?? existing.design_score,
          audit: b.audit || existing.audit,
        };
      }

      return {
        id: crypto.randomUUID(),
        business_id: b.id,
        name: b.name,
        phone: b.phone,
        address: b.address,
        website_url: b.website_url,
        audit_score: b.audit?.score ?? null,
        design_score: b.audit?.ai_critique?.design_score ?? null,
        outreach_status: 'not_contacted',
        follow_up_date: null,
        notes: '',
        custom_fields: {},
        saved_at: new Date().toISOString(),
        audit: b.audit,
      };
    });

    const existingMap = new Map(savedLeads.map(l => [l.business_id, l]));
    newSavedItems.forEach(item => {
      existingMap.set(item.business_id, item);
    });

    const merged = Array.from(existingMap.values());
    updateSavedLeadsState(merged);

    try {
      await fetch('/api/leads/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: newSavedItems }),
      });
    } catch (e) {
      console.warn('Failed to sync saved leads with API:', e);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}
  };

  const handleUpdateSavedLead = async (updated: SavedLead) => {
    const nextList = savedLeads.map(l => (l.id === updated.id ? updated : l));
    updateSavedLeadsState(nextList);

    try {
      await fetch('/api/leads/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: updated }),
      });
    } catch (e) {
      console.warn('Failed to update lead on server:', e);
    }
  };

  const handleDeleteSavedLead = async (leadId: string) => {
    const nextList = savedLeads.filter(l => l.id !== leadId);
    updateSavedLeadsState(nextList);

    try {
      await fetch('/api/leads/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });
    } catch (e) {
      console.warn('Failed to delete lead from server:', e);
    }
  };

  const handleExportCsv = async (leadsToExport: (Business | SavedLead)[]) => {
    try {
      setIsExporting(true);
      const filename = activeView === 'crm' ? 'prospects-crm-pipeline.csv' : `${category.toLowerCase().replace(/\s+/g, '-')}-audit-leads.csv`;

      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businesses: leadsToExport,
          filename,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate CSV export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // If checking session
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0f19] text-white gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center animate-spin">
          <Loader2 className="w-6 h-6 text-black stroke-[3]" />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-300">Checking Access Authentication...</p>
      </div>
    );
  }

  // If not authenticated, render Neubrutalism Login Form
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsConfigModalOpen(true)}
        leadCount={businesses.length}
        redesignCount={redesignCount}
        savedLeadsCount={savedLeads.length}
        isAuditing={isAuditing}
        activeView={activeView}
        onViewChange={setActiveView}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* VIEW 1: MAP & DISCOVERY */}
      {activeView === 'map' && (
        <>
          {/* 2. Control Bar */}
          <ControlBar
            category={category}
            onCategoryChange={setCategory}
            bounds={bounds}
            onBoundsChange={setBounds}
            onFindLeads={handleFindLeads}
            onRunAudit={handleRunAudit}
            isSearching={isSearching}
            isAuditing={isAuditing}
            auditProgress={auditProgress}
            leadCount={businesses.length}
            onOpenSingleAuditModal={() => setIsSingleAuditModalOpen(true)}
          />

          {/* 3. Main Workspace: Map (Left/Center) + Split Results Drawer (Right) */}
          <main className="flex-1 flex relative overflow-hidden">
            <div className="flex-1 h-full relative">
              <MapComponent
                businesses={businesses}
                selectedBusinessId={selectedBusiness?.id || null}
                onSelectBusiness={(b) => setSelectedBusiness(b)}
                bounds={bounds}
                onBoundsChange={setBounds}
              />
            </div>

            <ResultsDrawer
              businesses={businesses}
              selectedBusinessId={selectedBusiness?.id || null}
              onSelectBusiness={(b) => setSelectedBusiness(b)}
              isCollapsed={isDrawerCollapsed}
              onToggleCollapse={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
              onExportCsv={handleExportCsv}
              isExporting={isExporting}
              onSaveToCrm={handleSaveToCrm}
              savedBusinessIds={savedBusinessIds}
              onAuditSingleLead={handleAuditSingleLead}
              auditingLeadId={auditingLeadId}
            />
          </main>
        </>
      )}

      {/* VIEW 2: SAVED PROSPECTS CRM DATABASE */}
      {activeView === 'crm' && (
        <ProspectsCrmView
          savedLeads={savedLeads}
          onUpdateLead={handleUpdateSavedLead}
          onDeleteLead={handleDeleteSavedLead}
          onSelectBusinessForModal={(b) => setSelectedBusiness(b)}
          onExportCsv={handleExportCsv}
          isExporting={isExporting}
        />
      )}

      {/* 4. Detailed Audit & AI Pitch Modal */}
      {selectedBusiness && (
        <AuditDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onReAudit={handleAuditSingleLead}
          isReAuditing={auditingLeadId === selectedBusiness?.id}
        />
      )}

      {/* 5. Configuration & Architecture Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* 6. Single Audit Target Modal */}
      <SingleAuditModal
        isOpen={isSingleAuditModalOpen}
        onClose={() => setIsSingleAuditModalOpen(false)}
        onAuditSingle={handleCustomSingleAudit}
        isAuditing={Boolean(auditingLeadId)}
      />
    </div>
  );
}
