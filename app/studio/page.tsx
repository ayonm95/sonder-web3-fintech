'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import {
  Disc,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Key,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { createAttestationPayload, ATTESTATION_LEGAL_STATEMENT } from '@/lib/engines/eip712';

const PIPELINE_STEPS = [
  'DRAFT',
  'UPLOADED',
  'PROCESSING',
  'MODERATION_REVIEW',
  'PUBLISHED',
  'MONETIZED',
];

export default function CreatorStudioPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Indian Electronica');
  const [audioUrl, setAudioUrl] = useState('https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80');
  const [durationSeconds, setDurationSeconds] = useState(195);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EIP-712 Signing Modal State
  const [attestationTrack, setAttestationTrack] = useState<any | null>(null);
  const [signingStatus, setSigningStatus] = useState<'idle' | 'signing' | 'verified' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [recoveredAddress, setRecoveredAddress] = useState('');

  async function loadCatalog() {
    try {
      const res = await fetch('/api/tracks');
      const json = await res.json();
      if (json.success) {
        setTracks(json.data);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  async function handleUploadTrack(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genre,
          audioUrl,
          coverUrl,
          durationSeconds,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTitle('');
        await loadCatalog();
      } else {
        alert(json.error || 'Failed to create track');
      }
    } catch (err) {
      console.error('Track creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function advanceTrackState(trackId: string, targetState: string) {
    try {
      const res = await fetch(`/api/tracks/${trackId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });

      const json = await res.json();
      if (json.success) {
        await loadCatalog();
      } else {
        alert(json.error || 'State transition failed');
      }
    } catch (err) {
      console.error('Failed state transition:', err);
    }
  }

  // EIP-712 Signing Routine (MetaMask or 1-Click Local Key)
  async function handleSignAttestation(useMetaMask: boolean) {
    if (!attestationTrack) return;
    setSigningStatus('signing');
    setStatusMessage(useMetaMask ? 'Requesting EIP-712 signature from MetaMask...' : 'Generating cryptographic signature with testnet key...');

    try {
      const creatorWallet = attestationTrack.artist.payoutWallet;
      const payload = createAttestationPayload({
        creatorAddress: creatorWallet,
        trackId: attestationTrack.id,
        trackTitle: attestationTrack.title,
      });

      let signature: string;
      let signerToVerify = creatorWallet;

      if (useMetaMask && typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        signerToVerify = accounts[0];

        // Format typed data JSON string for MetaMask
        const typedDataString = JSON.stringify({
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' },
            ],
            ...payload.types,
          },
          primaryType: 'RightsAttestation',
          domain: payload.domain,
          message: payload.message,
        });

        signature = await ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [signerToVerify, typedDataString],
        });
      } else {
        // Deterministic local developer wallet
        const wallet = ethers.Wallet.createRandom();
        signerToVerify = wallet.address;

        // Re-generate payload for this wallet
        const localPayload = createAttestationPayload({
          creatorAddress: signerToVerify,
          trackId: attestationTrack.id,
          trackTitle: attestationTrack.title,
        });

        signature = await wallet.signTypedData(
          localPayload.domain,
          localPayload.types,
          localPayload.message
        );
      }

      setStatusMessage('Submitting signature for server-side cryptographic recovery...');

      // Post to verification API
      const verifyRes = await fetch('/api/attestations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: attestationTrack.id,
          message: payload.message,
          signature,
          expectedSigner: signerToVerify,
          chainId: payload.domain.chainId,
        }),
      });

      const verifyJson = await verifyRes.json();

      if (verifyJson.success) {
        setSigningStatus('verified');
        setRecoveredAddress(verifyJson.data.recoveredSigner);
        setStatusMessage('Verified! Track is now legally attested and MONETIZED on-chain.');

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        await loadCatalog();
      } else {
        setSigningStatus('error');
        setStatusMessage(verifyJson.error || 'Verification failed');
      }
    } catch (err: any) {
      setSigningStatus('error');
      setStatusMessage(err.message || 'Signing failed');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/10 border border-brand-violet/20 text-xs font-mono text-brand-purple mb-2">
            <Disc className="h-3.5 w-3.5" />
            Creator Studio & Copyright Registry
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Master Catalog Pipeline</h1>
          <p className="text-xs text-slate-400">
            Strict lifecycle state progression backed by EIP-712 non-repudiable copyright attestation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-100 border border-white/10 text-xs font-mono text-slate-300">
            Active Catalog: <span className="text-brand-cyan font-bold">{tracks.length} Master Releases</span>
          </div>
        </div>
      </div>

      {/* Upload Wizard Form */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-brand-teal" />
          Ingest New Master Recording
        </h2>

        <form onSubmit={handleUploadTrack} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Track Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Bangalore Synth Odyssey"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-surface-200"
            >
              <option value="Indian Electronica">Indian Electronica</option>
              <option value="Indie Folk">Indie Folk</option>
              <option value="Cinematic Ambient">Cinematic Ambient</option>
              <option value="Neo-Soul / Hindustani">Neo-Soul / Hindustani</option>
              <option value="Ambient / Drone">Ambient / Drone</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Seconds)</label>
            <input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 180)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Audio Stream Source URL</label>
            <input
              type="text"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Artwork URL</label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !title}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-black font-semibold text-xs shadow-glow-cyan hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              {isSubmitting ? 'Ingesting Master...' : 'Register Master in DRAFT State'}
            </button>
          </div>
        </form>
      </div>

      {/* Catalog State Machine Pipeline List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Catalog State Machine Progression</h2>
        <div className="space-y-4">
          {tracks.map((track) => {
            const currentStepIdx = PIPELINE_STEPS.indexOf(track.state);

            return (
              <div
                key={track.id}
                className="p-5 rounded-2xl glass-card border border-white/10 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{track.title}</h3>
                      <span className="text-xs text-brand-teal font-mono">
                        ({track.artist.stageName})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {track.genre} • {Math.floor(track.durationSeconds / 60)}:
                      {(track.durationSeconds % 60).toString().padStart(2, '0')} min • ID: {track.id.slice(0, 8)}…
                    </div>
                  </div>

                  {/* Actions according to state */}
                  <div className="flex items-center gap-2">
                    {track.state === 'DRAFT' && (
                      <button
                        onClick={() => advanceTrackState(track.id, 'UPLOADED')}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-1.5"
                      >
                        Upload to Cloud <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {track.state === 'UPLOADED' && (
                      <button
                        onClick={() => advanceTrackState(track.id, 'PROCESSING')}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/30 transition-all flex items-center gap-1.5"
                      >
                        Run HLS Transcode & Fingerprint <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {track.state === 'PROCESSING' && (
                      <button
                        onClick={() => advanceTrackState(track.id, 'MODERATION_REVIEW')}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
                      >
                        Submit to Moderation <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {track.state === 'MODERATION_REVIEW' && (
                      <button
                        onClick={() => advanceTrackState(track.id, 'PUBLISHED')}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                      >
                        Pass Moderation & Publish <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {track.state === 'PUBLISHED' && (
                      <button
                        onClick={() => {
                          setAttestationTrack(track);
                          setSigningStatus('idle');
                          setStatusMessage('');
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-pink text-white text-xs font-bold shadow-glow-purple hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Sign EIP-712 Rights Attestation
                      </button>
                    )}

                    {track.state === 'MONETIZED' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Monetized & Royalty Eligible
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Pipeline Bar */}
                <div className="pt-2">
                  <div className="grid grid-cols-6 gap-1 sm:gap-2">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isComplete = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`h-2 w-full rounded-full transition-all ${
                              isComplete
                                ? 'bg-emerald-400'
                                : isCurrent
                                ? 'bg-brand-cyan animate-pulse shadow-glow-cyan'
                                : 'bg-white/10'
                            }`}
                          />
                          <span
                            className={`text-[9px] sm:text-[10px] font-mono mt-1 text-center truncate w-full ${
                              isCurrent
                                ? 'text-brand-cyan font-bold'
                                : isComplete
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* EIP-712 Signature Evidence if present */}
                {track.rightsAttestationSignature && (
                  <div className="p-3 rounded-xl bg-surface-300/80 border border-white/5 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Cryptographic Warranty Bound
                      </span>
                      <span>Signer: {track.rightsAttestationSigner}</span>
                    </div>
                    <div className="truncate text-slate-500">
                      Sig: {track.rightsAttestationSignature}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EIP-712 Signing Modal */}
      {attestationTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-3xl glass-panel p-6 border border-white/15 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-brand-cyan font-mono text-xs">
                <ShieldCheck className="h-4 w-4" />
                EIP-712 Rights Attestation Signing
              </div>
              <button
                onClick={() => setAttestationTrack(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-200 border border-white/10 space-y-1.5">
                <div className="font-bold text-white text-sm">
                  {attestationTrack.title}
                </div>
                <div className="text-slate-400 font-mono">
                  Creator Identity: {attestationTrack.artist.payoutWallet}
                </div>
              </div>

              {/* Legal Warranty Text under Indian Copyright Act */}
              <div className="p-4 rounded-xl bg-brand-violet/10 border border-brand-violet/20 text-slate-300 space-y-2">
                <div className="font-semibold text-brand-purple flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Statutory Warranty & Indemnity (Copyright Act 1957 Sec 19)
                </div>
                <p className="text-[11px] leading-relaxed italic text-slate-300">
                  "{ATTESTATION_LEGAL_STATEMENT}"
                </p>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono ${
                    signingStatus === 'verified'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : signingStatus === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                  }`}
                >
                  {statusMessage}
                  {recoveredAddress && (
                    <div className="text-[10px] text-slate-300 mt-1">
                      Recovered Signer: {recoveredAddress}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleSignAttestation(true)}
                disabled={signingStatus === 'signing'}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-xs shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Key className="h-4 w-4" />
                Sign with MetaMask (Sepolia/Amoy)
              </button>

              <button
                onClick={() => handleSignAttestation(false)}
                disabled={signingStatus === 'signing'}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-black font-bold text-xs shadow-glow-cyan hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Instant Testnet Key Signer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
