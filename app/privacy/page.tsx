'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  Download,
  EyeOff,
  UserX,
  FileText,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function PrivacyPage() {
  const [privacyData, setPrivacyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function loadPrivacy() {
    setLoading(true);
    try {
      const res = await fetch('/api/privacy');
      const json = await res.json();
      if (json.success) {
        setPrivacyData(json.data);
      }
    } catch (err) {
      console.error('Failed to load privacy data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrivacy();
  }, []);

  async function handleRevoke(consentId: string) {
    try {
      const res = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE_CONSENT', consentId }),
      });
      const json = await res.json();
      if (json.success) {
        await loadPrivacy();
      }
    } catch (err) {
      console.error('Consent revocation failed:', err);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXPORT_USER_DATA' }),
      });
      const json = await res.json();

      if (json.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `sonder-dpdp-data-export-${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      console.error('Data export error:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-2">
            <Lock className="h-3.5 w-3.5" />
            Digital Personal Data Protection (DPDP) Act 2023 & GDPR
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Vault & Fan CRM</h1>
          <p className="text-xs text-slate-400">
            Enforcing k-anonymity query suppression, cryptographic consent ledgering, and instant Art 12 data portability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black text-xs font-bold shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating Bundle...' : 'Export Personal Data (DPDP Art 12)'}
          </button>

          <button
            onClick={loadPrivacy}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* k-Anonymity Explainer & Cohort Matrix */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-brand-cyan" />
            Query-Layer k-Anonymity Enforcement (Threshold k = 25)
          </h3>
          <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">
            Re-identification Guard Active
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          To prevent de-anonymization and linkage attacks on listener identities, aggregated audience demographics are strictly filtered at the database query layer: any cohort with fewer than 25 listeners is suppressed from platform analytics.
        </p>

        {/* Cohorts Table */}
        <div className="overflow-x-auto rounded-2xl bg-surface-200 border border-white/5">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-white/10 bg-white/5 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Audience Geographic Cohort</th>
                <th className="py-3 px-4">Listener Count</th>
                <th className="py-3 px-4">Average Listening Duration</th>
                <th className="py-3 px-4">Privacy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {privacyData?.cohorts?.map((c: any) => {
                return (
                  <tr
                    key={c.city}
                    className={`transition-colors ${
                      c.isSuppressed ? 'bg-amber-500/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-white">{c.city}</td>
                    <td className="py-3 px-4">
                      {c.isSuppressed ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                          {c.listenersCount}
                        </span>
                      ) : (
                        <span className="text-slate-200">{c.listenersCount} listeners</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.isSuppressed ? (
                        <span className="italic text-slate-600">[DATA REDACTED]</span>
                      ) : (
                        `${c.avgStreamMin} min/session`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.isSuppressed ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                          <Shield className="h-3 w-3" /> k-Anonymity Protected
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Aggregation Permitted
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DPDP Consent Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-teal" />
            Immutable DPDP Consent Records
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {privacyData?.consents?.length || 0} Registered Consents
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-white/10 bg-white/5 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">User Principal</th>
                <th className="py-3 px-4">Authorized Scope</th>
                <th className="py-3 px-4">Policy Version Hash</th>
                <th className="py-3 px-4">Granted At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {privacyData?.consents?.map((consent: any) => {
                return (
                  <tr key={consent.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{consent.userEmail}</td>
                    <td className="py-3 px-4 text-brand-cyan">{consent.scope}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                      {consent.policyVersionHash}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(consent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {consent.isRevoked ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          REVOKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          ACTIVE CONSENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!consent.isRevoked && (
                        <button
                          onClick={() => handleRevoke(consent.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <UserX className="h-3 w-3" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
