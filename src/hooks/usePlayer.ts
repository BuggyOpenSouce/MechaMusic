import { useState, useCallback, useRef } from 'react';
import { Song, PlayerState } from '../types';

export const usePlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    shuffle: false,
    repeat: 'none',
    queue: [],
    currentIndex: 0
  });

  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);

  const playSong = useCallback((song: Song, queue: Song[] = []) => {
    const newQueue = queue.length > 0 ? queue : [song];
    const currentIndex = newQueue.findIndex(s => s.id === song.id);
    
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      queue: newQueue,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      isPlaying: true,
      currentTime: 0,
      duration: 0
    }));
    setSeekTime(0);
  }, []);

  const togglePlay = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  }, []);

  const nextSong = useCallback(() => {
    setPlayerState(prev => {
      const { queue, currentIndex, shuffle, repeat } = prev;
      if (queue.length === 0) return prev;

      let nextIndex = currentIndex;
      
      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else if (repeat === 'one') {
        nextIndex = currentIndex;
      } else if (repeat === 'all') {
        nextIndex = (currentIndex + 1) % queue.length;
      } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) return prev;
      }

      const nextSong = queue[nextIndex];
      return {
        ...prev,
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        currentTime: 0,
        duration: 0
      };
    });
    setSeekTime(0);
  }, []);

  const previousSong = useCallback(() => {
    setPlayerState(prev => {
      const { queue, currentIndex } = prev;
      if (queue.length === 0 || currentIndex === 0) return prev;

      const prevIndex = currentIndex - 1;
      const prevSong = queue[prevIndex];
      
      return {
        ...prev,
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        currentTime: 0,
        duration: 0
      };
    });
    setSeekTime(0);
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPlayerState(prev => ({ ...prev, volume }));
  }, []);

  const seekTo = useCallback((time: number) => {
    setPlayerState(prev => ({ ...prev, currentTime: time }));
    setSeekTime(time);
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'one' : prev.repeat === 'one' ? 'all' : 'none'
    }));
  }, []);

  const updatePlayerState = useCallback((isPlaying: boolean, currentTime: number, duration: number) => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying,
      currentTime,
      duration
    }));
  }, []);

  const handleSongEnd = useCallback(() => {
    setPlayerState(prev => {
      const { repeat, currentSong, queue, currentIndex } = prev;
      
      if (repeat === 'one' && currentSong) {
        // Repeat current song
        return {
          ...prev,
          currentTime: 0,
          isPlaying: true
        };
      } else {
        // Move to next song or stop if at end
        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          const nextSong = queue[nextIndex];
          return {
            ...prev,
            currentSong: nextSong,
            currentIndex: nextIndex,
            currentTime: 0,
            isPlaying: true
          };
        } else if (repeat === 'all' && queue.length > 0) {
          // Restart from beginning
          return {
            ...prev,
            currentSong: queue[0],
            currentIndex: 0,
            currentTime: 0,
            isPlaying: true
          };
        } else {
          // Stop playing
          return {
            ...prev,
            isPlaying: false,
            currentTime: 0
          };
        }
      }
    });
  }, []);

  return {
    playerState,
    seekTime,
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    updatePlayerState,
    handleSongEnd
  };
};