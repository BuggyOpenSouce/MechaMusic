import React, { useState, useEffect } from 'react';
import { MobileNavigation } from './mobile/MobileNavigation';
import { MobilePlayer } from './mobile/MobilePlayer';
import { MobileHome } from './mobile/MobileHome';
import { MobilePlaylists } from './mobile/MobilePlaylists';
import { MobileSearch } from './mobile/MobileSearch';
import { MobileLibrary } from './mobile/MobileLibrary';
import { MobilePlaylistView } from './mobile/MobilePlaylistView';
import { MobileAIChat } from './mobile/MobileAIChat';
import { MobileSettings } from './mobile/MobileSettings';
import { MobileNowPlaying } from './mobile/MobileNowPlaying';
import { Playlist, Song, PlayerState, SpotifyAuthState } from '../types';

interface MobileAppProps {
  playlists: Playlist[];
  recentSongs: Song[];
  favorites: Song[];
  playerState: PlayerState;
  currentPage: string;
  currentPlaylist: Playlist | null;
  spotifyAuthState: SpotifyAuthState;
  onPageChange: (page: string) => void;
  onPlaylistSelect: (playlist: Playlist | null) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onPlaylistsUpdate: (playlists: Playlist[]) => void;
  onSettingsUpdate: (settings: any) => void;
  settings: any;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onPlaylistGenerated: (songs: string[], source?: 'youtube' | 'spotify') => Promise<any>;
  aiMessages: any[];
  onAIMessagesUpdate: (messages: any[]) => void;
  isCreatingPlaylist: boolean;
  onSingerSelect: (singer: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const MobileApp: React.FC<MobileAppProps> = (props) => {
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  // Handle back button for now playing
  useEffect(() => {
    const handlePopState = () => {
      if (showNowPlaying) {
        setShowNowPlaying(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showNowPlaying]);

  const handlePlayerClick = () => {
    if (props.playerState.currentSong) {
      setShowNowPlaying(true);
      // Add to history for back button
      window.history.pushState({ nowPlaying: true }, '');
    }
  };

  const handleCloseNowPlaying = () => {
    setShowNowPlaying(false);
    window.history.back();
  };

  const renderCurrentPage = () => {
    if (showNowPlaying && props.playerState.currentSong) {
      return (
        <MobileNowPlaying
          playerState={props.playerState}
          onClose={handleCloseNowPlaying}
          onTogglePlay={props.onTogglePlay}
          onNext={props.onNext}
          onPrevious={props.onPrevious}
          onSeek={props.onSeek}
          onVolumeChange={props.onVolumeChange}
          onToggleShuffle={props.onToggleShuffle}
          onToggleRepeat={props.onToggleRepeat}
          onToggleFavorite={props.onToggleFavorite}
          isFavorite={props.isFavorite}
        />
      );
    }

    if (props.currentPlaylist) {
      return (
        <MobilePlaylistView
          playlist={props.currentPlaylist}
          onBack={() => props.onPlaylistSelect(null)}
          onSongPlay={props.onSongPlay}
          currentSong={props.playerState.currentSong}
          isPlaying={props.playerState.isPlaying}
          playlists={props.playlists}
          onPlaylistsUpdate={props.onPlaylistsUpdate}
        />
      );
    }

    switch (props.currentPage) {
      case 'home':
        return (
          <MobileHome
            playlists={props.playlists}
            recentSongs={props.recentSongs}
            onPlaylistClick={props.onPlaylistSelect}
            onSongPlay={props.onSongPlay}
            currentSong={props.playerState.currentSong}
            isPlaying={props.playerState.isPlaying}
          />
        );
      case 'search':
        return (
          <MobileSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={searchResults}
            onSearchResults={setSearchResults}
            onSongPlay={props.onSongPlay}
            currentSong={props.playerState.currentSong}
            isPlaying={props.playerState.isPlaying}
          />
        );
      case 'library':
        return (
          <MobileLibrary
            playlists={props.playlists}
            favorites={props.favorites}
            recentSongs={props.recentSongs}
            onPlaylistClick={props.onPlaylistSelect}
            onSongPlay={props.onSongPlay}
            currentSong={props.playerState.currentSong}
            isPlaying={props.playerState.isPlaying}
          />
        );
      case 'playlists':
        return (
          <MobilePlaylists
            playlists={props.playlists}
            onPlaylistClick={props.onPlaylistSelect}
            onSongPlay={props.onSongPlay}
            currentSong={props.playerState.currentSong}
            isPlaying={props.playerState.isPlaying}
            onPlaylistsUpdate={props.onPlaylistsUpdate}
          />
        );
      case 'ai-chat':
        return (
          <MobileAIChat
            messages={props.aiMessages}
            onMessagesUpdate={props.onAIMessagesUpdate}
            onPlaylistGenerated={props.onPlaylistGenerated}
            isCreatingPlaylist={props.isCreatingPlaylist}
            spotifyAuthState={props.spotifyAuthState}
            playlists={props.playlists}
          />
        );
      case 'settings':
        return (
          <MobileSettings
            settings={props.settings}
            onSettingsUpdate={props.onSettingsUpdate}
            isDarkMode={props.isDarkMode}
            onThemeToggle={props.onThemeToggle}
            spotifyAuthState={props.spotifyAuthState}
            onExportData={props.onExportData}
            onImportData={props.onImportData}
          />
        );
      default:
        return (
          <MobileHome
            playlists={props.playlists}
            recentSongs={props.recentSongs}
            onPlaylistClick={props.onPlaylistSelect}
            onSongPlay={props.onSongPlay}
            currentSong={props.playerState.currentSong}
            isPlaying={props.playerState.isPlaying}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderCurrentPage()}
      </div>

      {/* Mini Player */}
      {props.playerState.currentSong && !showNowPlaying && (
        <div className="flex-shrink-0">
          <MobilePlayer
            playerState={props.playerState}
            onClick={handlePlayerClick}
            onTogglePlay={props.onTogglePlay}
            onNext={props.onNext}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      {!showNowPlaying && (
        <div className="flex-shrink-0">
          <MobileNavigation
            currentPage={props.currentPage}
            onPageChange={props.onPageChange}
            hasCurrentSong={!!props.playerState.currentSong}
          />
        </div>
      )}
    </div>
  );
};