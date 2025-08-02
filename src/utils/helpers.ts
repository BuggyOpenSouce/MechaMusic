import { Song, YouTubeVideo } from '../types';
import { SpotifyTrack } from '../services/spotifyApi';

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
};

export const youtubeToSong = (video: YouTubeVideo): Song => {
  return {
    id: video.id,
    title: video.title,
    artist: video.channelTitle,
    duration: parseDuration(video.duration),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnail: video.thumbnails.medium?.url || video.thumbnails.default.url,
    source: 'youtube',
    addedAt: new Date()
  };
};

export const spotifyToSong = (track: SpotifyTrack): Song => {
  return {
    id: `spotify_${track.id}`,
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    duration: Math.floor(track.duration_ms / 1000),
    url: track.external_urls.spotify,
    thumbnail: track.album.images[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image',
    source: 'spotify',
    addedAt: new Date(),
    previewUrl: track.preview_url,
    spotifyId: track.id
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};