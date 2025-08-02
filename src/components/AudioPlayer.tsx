import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';

interface AudioPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onStateChange: (isPlaying: boolean, currentTime: number, duration: number) => void;
  onEnded: () => void;
  volume: number;
  seekTime?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  song,
  isPlaying,
  onStateChange,
  onEnded,
  volume,
  seekTime
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeekTimeRef = useRef<number | undefined>(undefined);

  // Handle song changes
  useEffect(() => {
    if (!audioRef.current || !song) return;

    // Only use audio player for Spotify preview URLs or local files
    if (song.source === 'spotify' && song.previewUrl) {
      audioRef.current.src = song.previewUrl;
      audioRef.current.load();
    } else if (song.source === 'local' && song.url) {
      audioRef.current.src = song.url;
      audioRef.current.load();
    } else {
      // For YouTube or other sources, don't use audio player
      return;
    }

    setIsReady(false);
  }, [song]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !isReady || !song) return;

    // Only handle Spotify preview URLs or local files
    if ((song.source === 'spotify' && song.previewUrl) || song.source === 'local') {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isReady, song]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seek
  useEffect(() => {
    if (!audioRef.current || !isReady || seekTime === undefined || seekTime === lastSeekTimeRef.current) return;
    
    audioRef.current.currentTime = seekTime;
    lastSeekTimeRef.current = seekTime;
  }, [seekTime, isReady]);

  const handleLoadedData = () => {
    setIsReady(true);
    if (audioRef.current) {
      onStateChange(false, 0, audioRef.current.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      onStateChange(
        !audioRef.current.paused,
        audioRef.current.currentTime,
        audioRef.current.duration || 0
      );
    }
  };

  const handleEnded = () => {
    onStateChange(false, audioRef.current?.duration || 0, audioRef.current?.duration || 0);
    onEnded();
  };

  const handlePlay = () => {
    if (audioRef.current) {
      onStateChange(true, audioRef.current.currentTime, audioRef.current.duration || 0);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      onStateChange(false, audioRef.current.currentTime, audioRef.current.duration || 0);
    }
  };

  // Only render for supported sources
  if (!song || (song.source !== 'spotify' && song.source !== 'local')) {
    return null;
  }

  return (
    <audio
      ref={audioRef}
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onPlay={handlePlay}
      onPause={handlePause}
      onError={(e) => {
        console.error('Audio player error:', e);
        onEnded();
      }}
      preload="metadata"
      style={{ display: 'none' }}
    />
  );
};