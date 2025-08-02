import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';

interface YouTubePlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onStateChange: (isPlaying: boolean, currentTime: number, duration: number) => void;
  onEnded: () => void;
  volume: number;
  onSeek?: (time: number) => void;
  seekTime?: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  song,
  isPlaying,
  onStateChange,
  onEnded,
  volume,
  onSeek,
  seekTime
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVolumeRef = useRef(volume);
  const lastSeekTimeRef = useRef<number | null>(null);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };
  }, []);

  // Initialize player when song changes
  useEffect(() => {
    if (!apiLoaded || !containerRef.current || !song) return;

    const videoId = extractVideoId(song.url);
    if (!videoId) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    }

    // Create new player
    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            event.target.setVolume(volume * 100);
            lastVolumeRef.current = volume;
            
            // Start time update interval
            intervalRef.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getPlayerState) {
                try {
                  const currentTime = playerRef.current.getCurrentTime() || 0;
                  const duration = playerRef.current.getDuration() || 0;
                  const state = playerRef.current.getPlayerState();
                  const isCurrentlyPlaying = state === window.YT.PlayerState.PLAYING;
                  onStateChange(isCurrentlyPlaying, currentTime, duration);
                } catch (error) {
                  // Player might not be ready yet
                }
              }
            }, 1000);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const currentTime = playerRef.current?.getCurrentTime() || 0;
            const duration = playerRef.current?.getDuration() || 0;

            if (state === window.YT.PlayerState.PLAYING) {
              onStateChange(true, currentTime, duration);
            } else if (state === window.YT.PlayerState.PAUSED) {
              onStateChange(false, currentTime, duration);
            } else if (state === window.YT.PlayerState.ENDED) {
              onStateChange(false, duration, duration);
              onEnded();
            }
          },
          onError: (event: any) => {
            console.error('YouTube Player Error:', event.data);
            onEnded();
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }

    return () => {
      setIsReady(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [apiLoaded, song, onStateChange, onEnded]);

  // Handle play/pause
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const currentState = playerRef.current.getPlayerState();
      if (isPlaying && currentState !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && currentState === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  }, [isPlaying, isReady]);

  // Handle volume changes (without restarting)
  useEffect(() => {
    if (!isReady || !playerRef.current || lastVolumeRef.current === volume) return;
    
    try {
      playerRef.current.setVolume(volume * 100);
      lastVolumeRef.current = volume;
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [volume, isReady]);

  // Handle seek
  useEffect(() => {
    if (!isReady || !playerRef.current || seekTime === undefined || seekTime === lastSeekTimeRef.current) return;
    
    try {
      playerRef.current.seekTo(seekTime, true);
      lastSeekTimeRef.current = seekTime;
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [seekTime, isReady]);

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none'
      }} 
    />
  );
};