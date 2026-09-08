'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface TrackData {
  id: string;
  title: string;
  genre: string;
  durationSeconds: number;
  audioUrl: string;
  coverUrl?: string | null;
  state: string;
  rightsAttestationSignature?: string | null;
  artist: {
    stageName: string;
    payoutWallet: string;
  };
}

interface AudioPlayerContextType {
  currentTrack: TrackData | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  sessionToken: string | null;
  fraudRiskScore: number;
  isQualified: boolean;
  heartbeatCount: number;
  playTrack: (track: TrackData) => Promise<void>;
  pauseTrack: () => void;
  resumeTrack: () => void;
  seekTo: (seconds: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSeconds, setPositionSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [fraudRiskScore, setFraudRiskScore] = useState(0);
  const [isQualified, setIsQualified] = useState(false);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [volume, setVolumeState] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setPositionSeconds(Math.floor(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDurationSeconds(Math.floor(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      console.warn('Native audio source failed to load, switching to Web Audio synthesizer fallback');
      startSynthFallback();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      stopSynthFallback();
    };
  }, []);

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Web Audio Fallback Synthesizer for arbitrary or broken external URLs
  const startSynthFallback = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }

      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        // Generate warm musical drone (A2 + E3 + A3)
        const ctx = audioCtxRef.current;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
        gainNode.connect(ctx.destination);

        [110, 164.81, 220].forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(gainNode);
          osc.start();
          setTimeout(() => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {}
          }, 300000);
        });
      }

      // Advance position smoothly
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = setInterval(() => {
        setPositionSeconds((prev) => prev + 1);
      }, 1000);

      setIsPlaying(true);
    } catch (e) {
      console.error('Web Audio synth error:', e);
    }
  };

  const stopSynthFallback = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.suspend();
      } catch {}
    }
  };

  // Heartbeat emitter (fires every 8 seconds during active playback)
  useEffect(() => {
    if (isPlaying && sessionToken) {
      heartbeatTimerRef.current = setInterval(async () => {
        try {
          const currentPos = audioRef.current && !isNaN(audioRef.current.currentTime) && audioRef.current.currentTime > 0
            ? Math.floor(audioRef.current.currentTime)
            : positionSeconds;

          const res = await fetch(`/api/playback-sessions/${sessionToken}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionSeconds: currentPos }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setFraudRiskScore(json.data.fraudRiskScore || 0);
              setIsQualified(json.data.isQualified || false);
              setHeartbeatCount((prev) => prev + 1);
            }
          }
        } catch (e) {
          console.error('Heartbeat emission failed:', e);
        }
      }, 8000);
    } else {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [isPlaying, sessionToken, positionSeconds]);

  const playTrack = async (track: TrackData) => {
    try {
      setCurrentTrack(track);
      setPositionSeconds(0);
      setDurationSeconds(track.durationSeconds || 180);
      setIsQualified(false);
      setFraudRiskScore(0);
      setHeartbeatCount(0);
      stopSynthFallback();

      // Start new server session
      const sessionRes = await fetch('/api/playback-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      });

      if (sessionRes.ok) {
        const sessionJson = await sessionRes.json();
        if (sessionJson.success && sessionJson.data) {
          setSessionToken(sessionJson.data.sessionToken);
        }
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();

        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playErr) {
          console.warn('Native audio play error, activating Web Audio synthesizer fallback:', playErr);
          startSynthFallback();
        }
      } else {
        startSynthFallback();
      }
    } catch (err) {
      console.error('Playback initiation error:', err);
      startSynthFallback();
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopSynthFallback();
    setIsPlaying(false);
  };

  const resumeTrack = () => {
    if (audioRef.current && audioRef.current.src && !audioRef.current.error) {
      audioRef.current.play().catch(() => {
        startSynthFallback();
      });
      setIsPlaying(true);
    } else {
      startSynthFallback();
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = seconds;
    }
    setPositionSeconds(seconds);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        positionSeconds,
        durationSeconds,
        sessionToken,
        fraudRiskScore,
        isQualified,
        heartbeatCount,
        playTrack,
        pauseTrack,
        resumeTrack,
        seekTo,
        volume,
        setVolume,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
