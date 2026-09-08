'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Repeat,
  Zap,
  Globe,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';

export default function FraudDiagnosticsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'EXCLUDED' | 'QUALIFIED'>('ALL');
  const [inspectedSession, setInspectedSession] = useState<any | null>(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/playback-sessions?limit=50');
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error('Failed to load playback sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'EXCLUDED') return s.status === 'FRAUD_EXCLUDED';
    if (filter === 'QUALIFIED') return s.qualifiedDurationSec >= 30 && s.status !== 'FRAUD_EXCLUDED';
    return true;
  });

  const excludedCount = sessions.filter((s) => s.status === 'FRAUD_EXCLUDED').length;
  const qualifiedCount = sessions.filter(
    (s) => s.qualifiedDurationSec >= 30 && s.status !== 'FRAUD_EXCLUDED'
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            Playback Integrity & Stream Anomaly Detection
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Anti-Fraud & Listening Diagnostics</h1>
          <p className="text-xs text-slate-400">
            Rule-based multi-signal scoring to detect loop farming, robotic heartbeat cadences, and synthetic stream inflation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSessions}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Detection Pillars Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-brand-purple" /> Loop Farming
            </span>
            <span className="text-[10px] font-mono text-slate-400">&gt;6/hour</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Identifies repetitive cycling of single tracks without interaction or variance.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> Velocity Anomaly
            </span>
            <span className="text-[10px] font-mono text-slate-400">&gt;2.5x rate</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Detects skips and scrub-jumping intended to farm 30-second qualified listening thresholds.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-cyan" /> Heartbeat Drift
            </span>
            <span className="text-[10px] font-mono text-slate-400">cadence drift</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Flags synthetic automated clients delivering heartbeats at non-human millisecond cadences.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-emerald-400" /> Concurrency
            </span>
            <span className="text-[10px] font-mono text-slate-400">&gt;2 streams</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Disallows multiple overlapping active audio sessions spawned from identical listener sessions.
          </p>
        </div>
      </div>

      {/* Aggregate Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface-200 border border-white/10 flex items-center justify-between font-mono">
          <div>
            <div className="text-xs text-slate-400">Total Monitored Sessions</div>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
          </div>
          <Radio className="h-8 w-8 text-slate-600" />
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between font-mono">
          <div>
            <div className="text-xs text-emerald-400">Qualified Streams</div>
            <div className="text-2xl font-bold text-emerald-400">{qualifiedCount}</div>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between font-mono">
          <div>
            <div className="text-xs text-red-400">Fraud Excluded Sessions</div>
            <div className="text-2xl font-bold text-red-400">{excludedCount}</div>
          </div>
          <ShieldAlert className="h-8 w-8 text-red-500/40" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === 'ALL'
              ? 'bg-white/15 text-white font-bold'
              : 'text-slate-400 bg-surface-100 hover:text-white'
          }`}
        >
          All Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setFilter('EXCLUDED')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === 'EXCLUDED'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
              : 'text-slate-400 bg-surface-100 hover:text-white'
          }`}
        >
          Flagged & Excluded ({excludedCount})
        </button>

        <button
          onClick={() => setFilter('QUALIFIED')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === 'QUALIFIED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-slate-400 bg-surface-100 hover:text-white'
          }`}
        >
          Qualified Royalties ({qualifiedCount})
        </button>
      </div>

      {/* Sessions Stream Table */}
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-white/10 bg-white/5 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Session Token</th>
                <th className="py-3 px-4">Track Title</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Qualified (Sec)</th>
                <th className="py-3 px-4">Signals / Reason</th>
                <th className="py-3 px-4">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSessions.map((session) => {
                const isExcluded = session.status === 'FRAUD_EXCLUDED';
                const score = session.fraudRiskScore || 0;

                return (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      {session.sessionToken.slice(0, 16)}…
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {session.track?.title || 'Unknown Track'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            score > 50
                              ? 'text-red-400'
                              : score > 20
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {score}/100
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${
                              score > 50 ? 'bg-red-500' : score > 20 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExcluded
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={session.qualifiedDurationSec >= 30 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {session.qualifiedDurationSec}s
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                      {session.fraudReason || (score > 0 ? 'Elevated velocity' : 'Clean human playback')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setInspectedSession(session)}
                        className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-[10px] text-brand-cyan"
                      >
                        {session.events?.length || 0} Events
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Event Trace Modal */}
      {inspectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-3xl glass-panel p-6 border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Session Event Audit Trace
                </h3>
                <div className="text-[11px] font-mono text-slate-400">
                  {inspectedSession.sessionToken}
                </div>
              </div>
              <button
                onClick={() => setInspectedSession(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs">
              {inspectedSession.events?.map((evt: any, idx: number) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-surface-200 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <span className="font-bold text-brand-cyan">{evt.eventType}</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-3">
                    <span>Pos: {evt.positionSeconds}s</span>
                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
