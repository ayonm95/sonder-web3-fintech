'use client';

import React from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Activity,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import Image from 'next/image';

export function PersistentPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    positionSeconds,
    durationSeconds,
    pauseTrack,
    resumeTrack,
    seekTo,
    sessionToken,
    fraudRiskScore,
    isQualified,
    heartbeatCount,
    volume,
    setVolume,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface-300/90 backdrop-blur-2xl px-4 py-3 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-md">
            {currentTrack.coverUrl ? (
              <Image
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface-100 flex items-center justify-center text-xs font-mono">
                SONG
              </div>
            )}
            {/* Animated mini equalizer overlay when playing */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-end justify-center gap-0.5 pb-1">
                <span className="w-1 bg-brand-cyan rounded-full animate-[bounce_0.8s_infinite] h-3" />
                <span className="w-1 bg-brand-teal rounded-full animate-[bounce_0.5s_infinite] h-5" />
                <span className="w-1 bg-brand-purple rounded-full animate-[bounce_0.7s_infinite] h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-white tracking-tight">
              {currentTrack.title}
            </h4>
            <p className="truncate text-xs text-slate-400">
              {currentTrack.artist.stageName} •{' '}
              <span className="text-brand-teal/80 font-mono text-[10px]">{currentTrack.genre}</span>
            </p>
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full sm:w-2/4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => seekTo(Math.max(0, positionSeconds - 10))}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Back 10s"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={isPlaying ? pauseTrack : resumeTrack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-cyan to-brand-teal text-black shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black ml-0.5" />}
            </button>

            <button
              onClick={() => seekTo(Math.min(durationSeconds, positionSeconds + 10))}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Forward 10s"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Scrubber bar */}
          <div className="flex items-center gap-2.5 w-full max-w-md text-[11px] font-mono text-slate-400">
            <span>{formatTime(positionSeconds)}</span>
            <div
              className="relative flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = clickX / rect.width;
                seekTo(pct * durationSeconds);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-brand-cyan via-brand-teal to-brand-purple rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>

        {/* Right: Heartbeat Telemetry & Volume */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-1/4">
          {/* Live Fraud & Heartbeat Telemetry Chip */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200/90 border border-white/10 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPlaying ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isPlaying ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
            </span>

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Activity className="h-2.5 w-2.5 text-brand-cyan" />
                HB #{heartbeatCount} ({sessionToken ? sessionToken.slice(0, 10) + '…' : 'init'})
              </span>
              <span className="flex items-center gap-1">
                {fraudRiskScore > 50 ? (
                  <span className="text-red-400 flex items-center gap-0.5">
                    <ShieldAlert className="h-3 w-3" /> Risk {fraudRiskScore}/100
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3" />
                    {isQualified ? 'Qualified Stream' : `${Math.max(0, 30 - positionSeconds)}s to qualify`}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="hover:text-white p-1"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
