import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Song } from '../types';
import { renderIfDevEnabled } from '../dev_op';

interface SpotifyWebPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onStateChange: (isPlaying: boolean, currentTime: number, duration: number) => void;
  onEnded: () => void;
  volume: number;
  seekTime?: number;
  accessToken?: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface WebPlaybackState {
  context: {
    uri: string | null;
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: any;
    previous_tracks: any[];
    next_tracks: any[];
  };
}

interface WebPlaybackPlayer {
  device_id: string;
}

interface WebPlaybackError {
  message: string;
}

export const SpotifyWebPlayer: React.FC<SpotifyWebPlayerProps> = ({
  song,
  isPlaying,
  onStateChange,
  onEnded,
  volume,
  seekTime,
  accessToken
}) => {
  // Don't render for non-Spotify songs
  if (!song || song.source !== 'spotify') {
    return null;
  }

  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrackUriRef = useRef<string | null>(null);
  const lastSeekTimeRef = useRef<number | undefined>(undefined);
  const lastVolumeRef = useRef<number>(volume);
  const isInitializingRef = useRef<boolean>(false);

  const [sdkReady, setSdkReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<WebPlaybackState | null>(null);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) {
      setError('Access token required for Spotify playback');
      return;
    }

    // Check if SDK is already loaded
    if (window.Spotify && window.Spotify.Player) {
      setSdkReady(true);
      return;
    }

    // Check if script is already added
    if (document.querySelector('script[src*="sdk.scdn.co"]')) {
      return;
    }

    console.log('Loading Spotify Web Playback SDK...');
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK ready');
      setSdkReady(true);
    };

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [accessToken]);

  // Initialize player when SDK is ready
  useEffect(() => {
    if (!sdkReady || !accessToken || !window.Spotify || isInitializingRef.current) {
      return;
    }

    console.log('Initializing Spotify Web Playback SDK player...');
    isInitializingRef.current = true;

    // Clean up existing player
    if (playerRef.current) {
      try {
        playerRef.current.disconnect();
      } catch (error) {
        console.warn('Error disconnecting existing player:', error);
      }
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      // Create new player instance
      playerRef.current = new window.Spotify.Player({
        name: 'MechaMusic Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          console.log('Spotify requesting OAuth token');
          cb(accessToken);
        },
        volume: volume,
        enableMediaSession: true
      });

      // Add event listeners
      setupEventListeners();

      // Connect to Spotify
      playerRef.current.connect().then((success: boolean) => {
        console.log('Spotify player connection result:', success);
        if (success) {
          console.log('Successfully connected to Spotify Web Playback SDK');
          setError(null);
        } else {
          console.error('Failed to connect to Spotify Web Playback SDK');
          setError('Failed to connect to Spotify. Please ensure you have Spotify Premium.');
        }
        isInitializingRef.current = false;
      }).catch((error: any) => {
        console.error('Error connecting to Spotify:', error);
        setError('Connection failed. Please check your internet connection and try again.');
        isInitializingRef.current = false;
      });

    } catch (error) {
      console.error('Error creating Spotify player:', error);
      setError('Failed to initialize Spotify player. Please refresh the page.');
      isInitializingRef.current = false;
    }

    return () => {
      setPlayerReady(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.disconnect();
        } catch (error) {
          console.warn('Error disconnecting player on cleanup:', error);
        }
      }
    };
  }, [sdkReady, accessToken, volume]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!playerRef.current) return;

    // Ready event
    playerRef.current.addListener('ready', ({ device_id }: WebPlaybackPlayer) => {
      console.log('Spotify Web Playback SDK ready with Device ID:', device_id);
      deviceIdRef.current = device_id;
      setPlayerReady(true);
      setError(null);

      // Start position update interval
      intervalRef.current = setInterval(async () => {
        if (playerRef.current) {
          try {
            const state = await playerRef.current.getCurrentState();
            if (state) {
              setCurrentState(state);
              const currentTime = state.position / 1000;
              const duration = state.track_window.current_track?.duration_ms / 1000 || 0;
              const isCurrentlyPlaying = !state.paused;
              onStateChange(isCurrentlyPlaying, currentTime, duration);

              // Check if track ended
              if (state.position === 0 && state.paused && currentTrackUriRef.current) {
                onEnded();
              }
            }
          } catch (error) {
            // Ignore errors during state polling
          }
        }
      }, 1000);
    });

    // Not ready event
    playerRef.current.addListener('not_ready', ({ device_id }: WebPlaybackPlayer) => {
      console.log('Spotify Web Playback SDK not ready with Device ID:', device_id);
      setPlayerReady(false);
    });

    // Player state changed event
    playerRef.current.addListener('player_state_changed', (state: WebPlaybackState | null) => {
      if (!state) {
        console.log('Player state is null');
        return;
      }

      console.log('Player state changed:', state);
      setCurrentState(state);

      const currentTime = state.position / 1000;
      const duration = state.track_window.current_track?.duration_ms / 1000 || 0;
      const isCurrentlyPlaying = !state.paused;

      onStateChange(isCurrentlyPlaying, currentTime, duration);

      // Check if track ended
      if (state.position === 0 && state.paused && currentTrackUriRef.current) {
        console.log('Track ended');
        onEnded();
      }
    });

    // Autoplay failed event
    playerRef.current.addListener('autoplay_failed', () => {
      console.warn('Autoplay failed - user interaction required');
      setError('Autoplay blocked by browser. Click play to start playback.');
    });

    // Error event listeners
    playerRef.current.addListener('initialization_error', ({ message }: WebPlaybackError) => {
      console.error('Spotify initialization error:', message);
      setError(`Initialization failed: ${message}`);
    });

    playerRef.current.addListener('authentication_error', ({ message }: WebPlaybackError) => {
      console.error('Spotify authentication error:', message);
      setError(`Authentication failed: ${message}. Please check your access token.`);
    });

    playerRef.current.addListener('account_error', ({ message }: WebPlaybackError) => {
      console.error('Spotify account error:', message);
      setError(`Account error: ${message}. Spotify Premium required.`);
    });

    playerRef.current.addListener('playback_error', ({ message }: WebPlaybackError) => {
      console.error('Spotify playback error:', message);
      setError(`Playback error: ${message}`);
    });
  }, [onStateChange, onEnded]);

  // Handle song changes
  useEffect(() => {
    if (!playerReady || !deviceIdRef.current || !accessToken || !song || !song.spotifyId) {
      return;
    }

    const spotifyUri = `spotify:track:${song.spotifyId}`;
    
    // Don't reload the same track
    if (currentTrackUriRef.current === spotifyUri) {
      return;
    }

    console.log('Loading new Spotify track:', spotifyUri);
    currentTrackUriRef.current = spotifyUri;

    const playTrack = async () => {
      try {
        // Transfer playback to our device and play the track
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [spotifyUri],
            position_ms: 0
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Spotify API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        console.log('Successfully started Spotify playback');
        setError(null);

      } catch (error) {
        console.error('Error playing Spotify track:', error);
        setError(`Failed to play track: ${error.message}`);
      }
    };

    playTrack();
  }, [song, playerReady, accessToken]);

  // Handle play/pause
  useEffect(() => {
    if (!playerReady || !playerRef.current) {
      return;
    }

    const controlPlayback = async () => {
      try {
        if (isPlaying) {
          await playerRef.current.resume();
          console.log('Resumed playback');
        } else {
          await playerRef.current.pause();
          console.log('Paused playback');
        }
      } catch (error) {
        console.error('Error controlling playback:', error);
        setError(`Playback control failed: ${error.message}`);
      }
    };

    controlPlayback();
  }, [isPlaying, playerReady]);

  // Handle volume changes
  useEffect(() => {
    if (!playerReady || !playerRef.current || lastVolumeRef.current === volume) {
      return;
    }

    const setPlayerVolume = async () => {
      try {
        await playerRef.current.setVolume(volume);
        lastVolumeRef.current = volume;
        console.log('Volume set to:', volume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    };

    setPlayerVolume();
  }, [volume, playerReady]);

  // Handle seek
  useEffect(() => {
    if (!playerReady || !playerRef.current || seekTime === undefined || seekTime === lastSeekTimeRef.current) {
      return;
    }

    const seekToPosition = async () => {
      try {
        const positionMs = Math.floor(seekTime * 1000);
        await playerRef.current.seek(positionMs);
        lastSeekTimeRef.current = seekTime;
        console.log('Seeked to position:', seekTime);
      } catch (error) {
        console.error('Error seeking:', error);
        setError(`Seek failed: ${error.message}`);
      }
    };

    seekToPosition();
  }, [seekTime, playerReady]);

  // Activate element for autoplay (call this on user interaction)
  const activateElement = useCallback(async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.activateElement();
        console.log('Player element activated');
      } catch (error) {
        console.error('Error activating element:', error);
      }
    }
  }, []);

  // Expose additional player methods (optional)
  const playerMethods = {
    nextTrack: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.nextTrack();
        } catch (error) {
          console.error('Error skipping to next track:', error);
        }
      }
    },
    previousTrack: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.previousTrack();
        } catch (error) {
          console.error('Error going to previous track:', error);
        }
      }
    },
    togglePlay: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.togglePlay();
        } catch (error) {
          console.error('Error toggling play:', error);
        }
      }
    },
    getCurrentState: async () => {
      if (playerRef.current) {
        try {
          return await playerRef.current.getCurrentState();
        } catch (error) {
          console.error('Error getting current state:', error);
          return null;
        }
      }
      return null;
    },
    getVolume: async () => {
      if (playerRef.current) {
        try {
          return await playerRef.current.getVolume();
        } catch (error) {
          console.error('Error getting volume:', error);
          return 0;
        }
      }
      return 0;
    },
    setName: async (name: string) => {
      if (playerRef.current) {
        try {
          await playerRef.current.setName(name);
        } catch (error) {
          console.error('Error setting player name:', error);
        }
      }
    },
    activateElement
  };

  // Show error message if there's an issue
  if (error) {
    return renderIfDevEnabled('showSpotifyPlayerInfo', (
      <div className="fixed bottom-20 left-4 right-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3 text-center z-30">
        <p className="text-red-400 text-sm">
          🚫 Spotify Error: {error}
        </p>
        {error.includes('Premium') && (
          <p className="text-red-300 text-xs mt-1">
            Spotify Premium subscription required for full playback
          </p>
        )}
      </div>
    ));
  }

  // Show loading state
  if (!sdkReady || !playerReady) {
    return renderIfDevEnabled('showSpotifyPlayerInfo', (
      <div className="fixed bottom-20 left-4 right-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3 text-center z-30">
        <p className="text-blue-400 text-sm">
          🎵 {!sdkReady ? 'Loading Spotify SDK...' : 'Connecting to Spotify...'}
        </p>
      </div>
    ));
  }

  // Show ready state
  return renderIfDevEnabled('showSpotifyPlayerInfo', (
    <div className="fixed bottom-20 left-4 right-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-2 text-center z-30">
      <p className="text-green-400 text-xs">
        🎵 Spotify Web Player Ready • Device: {deviceIdRef.current?.substring(0, 8)}...
      </p>
    </div>
  ));
};