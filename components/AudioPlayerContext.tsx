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

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setPositionSeconds(Math.floor(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDurationSeconds(Math.floor(audio.duration));
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Heartbeat emitter (fires every 8 seconds during active playback)
  useEffect(() => {
    if (isPlaying && sessionToken) {
      heartbeatTimerRef.current = setInterval(async () => {
        try {
          const currentPos = audioRef.current ? Math.floor(audioRef.current.currentTime) : positionSeconds;
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
      setDurationSeconds(track.durationSeconds);
      setIsQualified(false);
      setFraudRiskScore(0);
      setHeartbeatCount(0);

      // Start new server session
      const sessionRes = await fetch('/api/playback-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      });

      if (sessionRes.ok) {
        const sessionJson = await sessionRes.json();
        if (sessionJson.success) {
          setSessionToken(sessionJson.data.sessionToken);
        }
      }

      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback initiation error:', err);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setPositionSeconds(seconds);
    }
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
