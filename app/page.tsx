'use client';

import React, { useEffect, useState } from 'react';
import { useAudioPlayer, TrackData } from '@/components/AudioPlayerContext';
import {
  Play,
  Pause,
  Headphones,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Radio,
  Flame,
} from 'lucide-react';
import Image from 'next/image';

export default function DiscoverPage() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer();

  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await fetch('/api/tracks');
        const json = await res.json();
        if (json.success) {
          setTracks(json.data);
        }
      } catch (err) {
        console.error('Failed to load tracks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTracks();
  }, []);

  const genres = ['All', 'Indian Electronica', 'Indie Folk', 'Cinematic Ambient', 'Neo-Soul / Hindustani', 'Ambient / Drone'];

  const filteredTracks =
    selectedGenre === 'All'
      ? tracks
      : tracks.filter((t) => t.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

  const totalMinutes = tracks.reduce((acc, t: any) => acc + (t.qualifiedMinutes || 0), 0);
  const totalStreams = tracks.reduce((acc, t: any) => acc + (t.totalStreams || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-12 glass-panel shadow-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-brand-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            Decentralized Royalty & Streaming Engine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Music That Pays{' '}
            <span className="bg-gradient-to-r from-brand-cyan via-brand-teal to-brand-purple bg-clip-text text-transparent">
              Creators First.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Direct subscriber pools, cryptographic Merkle tree settlements on Polygon Amoy, real EIP-712 copyright
            attestations, and immutable double-entry ledger bookkeeping.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs text-slate-400 font-mono">Escrow Vault</div>
              <div className="text-lg font-bold text-white">₹2,50,000</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Balanced 1:1
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs text-slate-400 font-mono">Qualified Stream Min</div>
              <div className="text-lg font-bold text-white">{totalMinutes.toLocaleString()} m</div>
              <div className="text-[10px] text-brand-cyan font-mono flex items-center gap-1">
                <Headphones className="h-3 w-3" /> Verified Listening
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs text-slate-400 font-mono">Settlement Method</div>
              <div className="text-lg font-bold text-white">Merkle Proof</div>
              <div className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
                <Radio className="h-3 w-3" /> Polygon Amoy
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs text-slate-400 font-mono">Statutory TDS</div>
              <div className="text-lg font-bold text-white">1% Sec 194O</div>
              <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Auto-Withheld
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedGenre === genre
                ? 'bg-gradient-to-r from-brand-cyan to-brand-teal text-black font-semibold shadow-glow-cyan'
                : 'bg-surface-100 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Music Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-brand-cyan" />
              Curated Master Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Select any track to stream with real-time heartbeat emission & fraud scoring telemetry.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {filteredTracks.length} Releases
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => {
              const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

              return (
                <div
                  key={track.id}
                  className="group relative overflow-hidden rounded-2xl glass-card p-4 flex flex-col justify-between"
                >
                  {/* Artwork & Play overlay */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-200">
                    {track.coverUrl ? (
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-600 font-mono">
                        SONDER
                      </div>
                    )}

                    {/* Gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* State badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          track.state === 'MONETIZED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-brand-purple/20 text-brand-purple border-brand-purple/30'
                        }`}
                      >
                        {track.state}
                      </span>
                    </div>

                    {/* EIP-712 Rights Attested Badge */}
                    {track.rightsAttestationSignature && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 backdrop-blur-md">
                        <ShieldCheck className="h-3 w-3" />
                        EIP-712 Signed
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute bottom-3 right-3">
                      <button
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            pauseTrack();
                          } else {
                            playTrack(track);
                          }
                        }}
                        className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
                          isCurrentlyPlaying
                            ? 'bg-emerald-400 text-black shadow-glow-cyan scale-105'
                            : 'bg-white/90 text-black hover:bg-brand-cyan hover:scale-110'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-5 w-5 fill-black" />
                        ) : (
                          <Play className="h-5 w-5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Track Meta */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight group-hover:text-brand-cyan transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">
                        {track.artist.stageName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {Math.floor(track.durationSeconds / 60)}:
                        {(track.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>

                      <span className="flex items-center gap-1 text-slate-300">
                        <Headphones className="h-3 w-3 text-brand-teal" />
                        {(track as any).totalStreams?.toLocaleString() || 0} plays
                      </span>

                      <span className="text-brand-cyan">
                        {(track as any).qualifiedMinutes?.toLocaleString() || 0} qMin
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
