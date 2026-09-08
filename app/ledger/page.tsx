'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  PlusCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function LedgerPage() {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // TDS interactive calculator state
  const [calcGrossInr, setCalcGrossInr] = useState('50000');

  async function loadLedger() {
    setLoading(true);
    try {
      const res = await fetch('/api/ledger');
      const json = await res.json();
      if (json.success) {
        setLedgerData(json.data);
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger();
  }, []);

  async function handleSimulate(action: 'SIMULATE_SUBSCRIPTION_INFLOW' | 'SIMULATE_CREATOR_PAYOUT', amountInr: string) {
    setSimulating(true);
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amountInr }),
      });
      const json = await res.json();
      if (json.success) {
        await loadLedger();
      } else {
        alert(json.error || 'Transaction simulation failed');
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  }

  const formatPaiseToInr = (minorStr: string) => {
    try {
      const minor = BigInt(minorStr || '0');
      const inr = Number(minor) / 100;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(inr);
    } catch {
      return '₹0.00';
    }
  };

  const grossVal = parseFloat(calcGrossInr) || 0;
  const tdsVal = grossVal * 0.01;
  const netVal = grossVal - tdsVal;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-xs font-mono text-brand-teal mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Financial Engine & Section 194O Ledger
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Double-Entry Financial Hub</h1>
          <p className="text-xs text-slate-400">
            Strict debit == credit mathematical invariant with automatic statutory 1% TDS deduction on creator payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Strict Invariant Badge */}
          {ledgerData?.isBalanced ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              INVARIANT SATISFIED: DEBITS == CREDITS
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold">
              INVARIANT VIOLATION: UNBALANCED
            </div>
          )}

          <button
            onClick={loadLedger}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Account Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {ledgerData?.accounts?.map((acc: any) => {
          return (
            <div
              key={acc.code}
              className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-brand-cyan font-bold">{acc.code}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {acc.type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-1 truncate">{acc.name}</h4>
              </div>

              <div>
                <div className="text-lg font-mono font-bold text-white">
                  {formatPaiseToInr(acc.netBalanceMinor)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {acc.entryCount} postings
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator & TDS Calculator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Simulator */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-cyan" />
              Live Transaction Posting Simulator
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
              Atomic Postings
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Execute synthetic multi-legged double-entry transactions to observe real-time balance sheet changes and invariant preservation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleSimulate('SIMULATE_SUBSCRIPTION_INFLOW', '100000')}
              disabled={simulating}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-brand-cyan/30 text-left hover:border-brand-cyan/60 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-brand-cyan transition-colors">
                  Subscriber Pool Inflow
                </span>
                <PlusCircle className="h-4 w-4 text-brand-cyan" />
              </div>
              <div className="text-lg font-bold font-mono text-brand-cyan">+₹1,00,000</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Debit 1010 (Cash) / Credit 4010 (Revenue)
              </div>
            </button>

            <button
              onClick={() => handleSimulate('SIMULATE_CREATOR_PAYOUT', '25000')}
              disabled={simulating}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-brand-purple/30 text-left hover:border-brand-purple/60 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-brand-purple transition-colors">
                  Creator Payout + TDS
                </span>
                <PlusCircle className="h-4 w-4 text-brand-purple" />
              </div>
              <div className="text-lg font-bold font-mono text-brand-purple">₹25,000</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Debit 2010 (Liab) / Credit 1010 & 2020 (1% TDS)
              </div>
            </button>
          </div>
        </div>

        {/* Section 194O TDS Interactive Calculator */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-400" />
              Section 194O Statutory TDS Breakdown
            </h3>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              1.00% Statutory Rate
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Under the Indian Income Tax Act Section 194O, digital platforms must deduct 1% TDS on gross creator earnings before payout remittance.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Simulated Gross Creator Royalty (₹)
              </label>
              <input
                type="number"
                value={calcGrossInr}
                onChange={(e) => setCalcGrossInr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-surface-200 border border-white/5">
                <div className="text-[10px] text-slate-400">Gross Royalty</div>
                <div className="text-xs font-bold text-white">₹{grossVal.toLocaleString()}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] text-amber-400">1% TDS (2020)</div>
                <div className="text-xs font-bold text-amber-400">-₹{tdsVal.toLocaleString()}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400">Net to Wallet</div>
                <div className="text-xs font-bold text-emerald-400">₹{netVal.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Double-Entry Journal Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Live Double-Entry Journal Log</h2>
          <span className="text-xs font-mono text-slate-400">
            {ledgerData?.recentEntries?.length || 0} Recent Postings
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-white/10 bg-white/5 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">Amount (Paise)</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Idempotency Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledgerData?.recentEntries?.map((entry: any) => {
                const isDebit = entry.direction === 'DEBIT';

                return (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-brand-cyan font-bold">{entry.accountCode}</span>{' '}
                      <span className="text-slate-300">({entry.accountName})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDebit
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {entry.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatPaiseToInr(entry.amountMinor)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{entry.amountMinor}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                      {entry.transactionId}
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
