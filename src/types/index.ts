export interface SpotifyAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: any | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail: string;
  source: 'youtube' | 'spotify';
  addedAt: Date;
  previewUrl?: string; // For Spotify preview URLs
  spotifyId?: string; // For linking to Spotify
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: Date;
  updatedAt: Date;
  isAIGenerated: boolean;
  coverImage?: string; // Custom playlist cover image (base64 or URL)
  source?: 'youtube' | 'spotify'; // Added for playlist source
  isSpotifyEnabled?: boolean; // Added for Spotify badge functionality
}

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  queue: Song[];
  currentIndex: number;
}

export interface AppState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  player: PlayerState;
  aiChat: AIMessage[];
  currentPage: 'home' | 'playlists' | 'favorites' | 'ai-chat' | 'import' | 'music' | 'settings' | 'singer';
  currentSinger: string | null;
  isDarkMode: boolean;
  language: 'en' | 'tr' | 'es'; // Added language support
  settings: {
    volume: number;
    autoPlay: boolean;
    showNotifications: boolean;
    language: 'en' | 'tr' | 'es';
    spotifyAccessToken?: string;
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  duration: string;
  thumbnails: {
    default: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}