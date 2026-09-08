'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  CheckCircle2,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { verifyAllocationProof, generateAllocationLeaf } from '@/lib/engines/merkle';

export default function SettlementPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(0);
  const [isComputing, setIsComputing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Verifier state
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [customWallet, setCustomWallet] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    leaf: string;
    proof: string[];
    creatorName: string;
    netAmountInr: string;
  } | null>(null);

  async function loadSettlements() {
    setLoading(true);
    try {
      const res = await fetch('/api/settlement');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setPeriods(json.data);
        // Default to first allocation's wallet
        if (json.data[0].allocations.length > 0) {
          setSelectedWallet(json.data[0].allocations[0].walletAddress);
        }
      }
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettlements();
  }, []);

  const activePeriod = periods[selectedPeriodIdx];

  // Run proof verification whenever selected wallet changes
  useEffect(() => {
    if (!activePeriod || !selectedWallet) return;

    const alloc = activePeriod.allocations.find(
      (a: any) => a.walletAddress.toLowerCase() === selectedWallet.toLowerCase()
    );

    if (alloc) {
      const netMinor = BigInt(alloc.netAmountMinor);
      const leaf = generateAllocationLeaf(
        alloc.walletAddress,
        netMinor,
        activePeriod.periodNumber
      );

      const isValid = verifyAllocationProof(
        alloc.merkleProof,
        activePeriod.merkleRoot,
        leaf
      );

      const netInr = (Number(netMinor) / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      });

      setVerificationResult({
        isValid,
        leaf,
        proof: alloc.merkleProof,
        creatorName: alloc.stageName,
        netAmountInr: netInr,
      });
    } else {
      setVerificationResult(null);
    }
  }, [selectedWallet, activePeriod]);

  async function handleComputeNewPeriod() {
    setIsComputing(true);
    try {
      const res = await fetch('/api/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPoolInr: '250000' }),
      });
      const json = await res.json();
      if (json.success) {
        await loadSettlements();
      } else {
        alert(json.error || 'Failed to compute settlement');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsComputing(false);
    }
  }

  async function handleBroadcastPeriod(periodId: string) {
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/settlement/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodId }),
      });
      const json = await res.json();
      if (json.success) {
        await loadSettlements();
      } else {
        alert(json.error || 'Failed to broadcast on-chain');
      }
    } catch (err) {
      console.error('Error broadcasting period:', err);
    } finally {
      setIsBroadcasting(false);
    }
  }

  const formatPaiseToInr = (minorStr: string) => {
    try {
      const minor = BigInt(minorStr || '0');
      return (Number(minor) / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      });
    } catch {
      return '₹0.00';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/10 border border-brand-violet/20 text-xs font-mono text-brand-purple mb-2">
            <GitBranch className="h-3.5 w-3.5" />
            OpenZeppelin Compatible Merkle Settlement
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Merkle Settlement Explorer</h1>
          <p className="text-xs text-slate-400">
            Off-chain qualified listening aggregation with transparent cryptographic commitments on Polygon Amoy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleComputeNewPeriod}
            disabled={isComputing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-black text-xs font-bold shadow-glow-cyan hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isComputing ? 'Computing Merkle Tree...' : 'Trigger Settlement Period Run'}
          </button>

          <button
            onClick={loadSettlements}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Selection Tabs */}
      {periods.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-slate-400 mr-2">Select Period:</span>
          {periods.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriodIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2.5 ${
                selectedPeriodIdx === idx
                  ? 'bg-brand-cyan/20 border border-brand-cyan/50 text-brand-cyan shadow-glow-cyan'
                  : 'bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-400'
              }`}
            >
              <span className="font-bold">Period #{p.periodNumber}</span>
              {p.status === 'COMMITTED_ON_CHAIN' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Polygon Amoy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Calculated (Off-Chain)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {activePeriod && (
        <>
          {/* Active Period Card */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    Settlement Period #{activePeriod.periodNumber}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                    activePeriod.status === 'COMMITTED_ON_CHAIN'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  }`}>
                    {activePeriod.status}
                  </span>
                  {activePeriod.status !== 'COMMITTED_ON_CHAIN' && (
                    <button
                      onClick={() => handleBroadcastPeriod(activePeriod.id)}
                      disabled={isBroadcasting}
                      className="ml-2 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isBroadcasting ? 'Broadcasting on-chain...' : 'Broadcast to Polygon Amoy'}
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Total Pool: {formatPaiseToInr(activePeriod.totalPoolMinor)} •{' '}
                  {activePeriod.allocations.length} Verified Creators
                </div>
              </div>

              {/* On-Chain Commitment Status Badge */}
              <div className="flex flex-col sm:flex-items-end gap-1.5">
                {activePeriod.onChainTxHash && (
                  <div className="flex items-center gap-2">
                    {activePeriod.status === 'COMMITTED_ON_CHAIN' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 font-semibold shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Commitment: Polygon Amoy (Live On-Chain)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Commitment: Local Registry (Simulated Tx)
                      </span>
                    )}
                    <a
                      href={`https://amoy.polygonscan.com/tx/${activePeriod.onChainTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-100 border border-white/10 text-[11px] font-mono text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                      title="Inspect hash on PolygonScan"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {activePeriod.onChainTxHash.slice(0, 10)}…
                    </a>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 font-mono text-right">
                  Cryptographic Merkle tree computed & verified off-chain
                </div>
              </div>
            </div>

            {/* Live On-Chain Verified Alert */}
            {activePeriod.status === 'COMMITTED_ON_CHAIN' && activePeriod.onChainTxHash && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-slate-300 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-white">Live On-Chain Commitment Verified:</strong> This settlement Merkle root has been broadcast and permanently etched into <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-500/30">SettlementManager.sol</code> on Polygon Amoy (Chain ID 80002). View the verified cryptographic event log live on <a href={`https://amoy.polygonscan.com/tx/${activePeriod.onChainTxHash}`} target="_blank" rel="noreferrer" className="text-brand-cyan underline font-mono hover:text-emerald-400 ml-1 font-bold">PolygonScan ↗</a>.
                </div>
              </div>
            )}

            {/* Merkle Root Highlight */}
            <div className="p-4 rounded-2xl bg-surface-300/80 border border-brand-cyan/20 space-y-1.5 font-mono">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>COMMITTED MERKLE ROOT (BYTES32)</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Root Committed
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-brand-cyan break-all">
                {activePeriod.merkleRoot}
              </div>
            </div>
          </div>

          {/* Interactive Cryptographic Proof Verifier */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Interactive Merkle Proof Verifier
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select any creator to extract their cryptographic leaf and verify their inclusion proof against the committed root.
              </p>
            </div>

            {/* Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Seeded Creator
                </label>
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono bg-surface-200"
                >
                  {activePeriod.allocations.map((alloc: any) => (
                    <option key={alloc.id} value={alloc.walletAddress}>
                      {alloc.stageName} — {alloc.walletAddress}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Or Paste Arbitrary Wallet Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customWallet}
                    onChange={(e) => setCustomWallet(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      if (customWallet) setSelectedWallet(customWallet);
                    }}
                    className="px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-mono text-slate-300"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cryptographic Result Card */}
            {verificationResult && (
              <div className="space-y-4 pt-2">
                <div
                  className={`p-4 rounded-2xl border ${
                    verificationResult.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    {verificationResult.isValid
                      ? 'CRYPTOGRAPHICALLY VALID: Proof accurately reconstructs root'
                      : 'INVALID PROOF: Inclusion verification failed'}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Entitled Creator: <span className="font-bold text-white">{verificationResult.creatorName}</span> • Net Royalty:{' '}
                    <span className="font-bold text-brand-cyan">{verificationResult.netAmountInr}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  {/* Leaf */}
                  <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400">
                      LEAF HASH: keccak256(address, netAmount, period)
                    </div>
                    <div className="text-xs text-brand-teal break-all">
                      {verificationResult.leaf}
                    </div>
                  </div>

                  {/* Proof */}
                  <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400">
                      AUDIT PROOF PATH ({verificationResult.proof.length} Sibling Hashes)
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {verificationResult.proof.map((p, i) => (
                        <div key={i} className="text-[11px] text-slate-300 truncate">
                          [{i}] {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Allocation Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Period Allocations with 1% Section 194O TDS</h3>
            <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-white/10 bg-white/5 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Wallet Address</th>
                    <th className="py-3 px-4">Qualified Minutes</th>
                    <th className="py-3 px-4">Gross Royalty</th>
                    <th className="py-3 px-4">1% TDS (194O)</th>
                    <th className="py-3 px-4">Net Claimable</th>
                    <th className="py-3 px-4">Proof Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activePeriod.allocations.map((alloc: any) => (
                    <tr key={alloc.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{alloc.stageName}</td>
                      <td className="py-3 px-4 text-slate-400">{alloc.walletAddress}</td>
                      <td className="py-3 px-4 text-brand-teal">{alloc.qualifiedMinutes} min</td>
                      <td className="py-3 px-4">{formatPaiseToInr(alloc.grossAmountMinor)}</td>
                      <td className="py-3 px-4 text-amber-400">
                        {formatPaiseToInr(alloc.tdsAmountMinor)}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formatPaiseToInr(alloc.netAmountMinor)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {alloc.merkleProof.length} nodes
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
