import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { SpotifyCallback } from './components/SpotifyCallback';
import { PlayerControls } from './components/PlayerControls';
import { ExpandedPlayer } from './components/ExpandedPlayer';
import { MultiSelectToolbar } from './components/MultiSelectToolbar';
import { HomePage } from './components/HomePage';
import { MusicPage } from './components/MusicPage';
import { PlaylistsPage } from './components/PlaylistsPage';
import { AIChat } from './components/AIChat';
import { ImportPage } from './components/ImportPage';
import { SettingsPage } from './components/SettingsPage';
import { SingerPage } from './components/SingerPage';
import { YouTubePlayer } from './components/YouTubePlayer';
import { SpotifyWebPlayer } from './components/SpotifyWebPlayer';
import { AudioPlayer } from './components/AudioPlayer';
import { usePlayer } from './hooks/usePlayer';
import { Playlist, Song, AIMessage, AppState } from './types';
import { youtubeApi } from './services/youtubeApi';
import { spotifyApi } from './services/spotifyApi';
import { spotifyAuth, SpotifyAuthState } from './services/spotifyAuth';
import { youtubeToSong, spotifyToSong, generateId } from './utils/helpers';
import { Loader } from './components/Loader';
import { exportDataToCSV, importDataFromCSV, downloadCSV, readCSVFile, AppData } from './utils/dataManager';
import { useTranslation } from './utils/translations';
import { SpotifyRefreshButton } from './components/SpotifyRefreshButton';
import { geminiApi } from './services/geminiApi';
import { SpotifyDebugButton } from './components/SpotifyDebugButton';
import { DevConfig, renderIfDevEnabled } from './dev_op';
import { MobileApp } from './components/MobileApp';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    playlists: [],
    currentPlaylist: null,
    currentSinger: null,
    player: {
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      shuffle: false,
      repeat: 'none',
      queue: [],
      currentIndex: 0
    },
    aiChat: [],
    currentPage: 'home',
    isDarkMode: true,
    settings: {
      volume: 1,
      autoPlay: true,
      showNotifications: true,
      language: 'en',
      spotifyAccessToken: undefined
    }
  });

  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [spotifyAuthState, setSpotifyAuthState] = useState<SpotifyAuthState>(spotifyAuth.getState());
  
  const { t } = useTranslation(appState.settings.language);

  const {
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
  } = usePlayer();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if this is a Spotify callback
  if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
    return <SpotifyCallback />;
  }

  useEffect(() => {
    // Subscribe to Spotify auth state changes
    const unsubscribe = spotifyAuth.subscribe((state) => {
      setSpotifyAuthState(state);
      // Update app settings with access token
      if (state.isAuthenticated && state.accessToken) {
        setAppState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            spotifyAccessToken: state.accessToken
          }
        }));
      } else {
        setAppState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            spotifyAccessToken: undefined
          }
        }));
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const savedData = localStorage.getItem('mechamusic-data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setAppState(prev => ({
            ...prev,
            playlists: parsed.playlists || [],
            isDarkMode: parsed.isDarkMode !== undefined ? parsed.isDarkMode : true,
            settings: { 
              ...prev.settings, 
              ...parsed.settings,
              spotifyAccessToken: parsed.settings?.spotifyAccessToken
            }
          }));
          setRecentSongs(parsed.recentSongs || []);
          setFavorites(parsed.favorites || []);
          setSidebarCollapsed(parsed.sidebarCollapsed || false);
          setPitch(parsed.pitch || 0);
          setSpeed(parsed.speed || 1);
          setMobileMenuOpen(false);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setLoadingComplete(true);
      }
    };

    loadAppData();

    // Listen for go to playlist event from AI chat
    const handleGoToPlaylist = (event: any) => {
      const playlist = event.detail;
      if (playlist) {
        setAppState(prev => ({ 
          ...prev, 
          currentPlaylist: playlist, 
          currentPage: 'playlists' 
        }));
      }
    };

    window.addEventListener('goToPlaylist', handleGoToPlaylist);
    return () => {
      window.removeEventListener('goToPlaylist', handleGoToPlaylist);
    };
  }, []);

  useEffect(() => {
    if (loadingComplete) {
      setIsLoading(false);
    }
  }, [loadingComplete]);

  useEffect(() => {
    const dataToSave = {
      playlists: appState.playlists,
      recentSongs: recentSongs,
      favorites: favorites,
      isDarkMode: appState.isDarkMode,
      settings: appState.settings,
      sidebarCollapsed: sidebarCollapsed,
      pitch: pitch,
      speed: speed
    };
    localStorage.setItem('mechamusic-data', JSON.stringify(dataToSave));
  }, [appState.playlists, recentSongs, favorites, appState.isDarkMode, appState.settings, sidebarCollapsed, pitch, speed]);

  const handleLoadComplete = () => {
    setLoadingComplete(true);
  };

  const handlePageChange = (page: string) => {
    setAppState(prev => ({ ...prev, currentPage: page, currentPlaylist: null, currentSinger: null }));
    setMultiSelectMode(false);
    setSelectedSongs([]);
  };

  const handlePlaylistsUpdate = (playlists: Playlist[]) => {
    setAppState(prev => ({ ...prev, playlists }));
  };

  const handlePlaylistSelect = (playlist: Playlist | null) => {
    setAppState(prev => ({ 
      ...prev, 
      currentPlaylist: playlist, 
      currentPage: playlist ? 'playlists' : prev.currentPage 
    }));
  };

  const handleSingerSelect = (singer: string) => {
    setAppState(prev => ({ 
      ...prev, 
      currentSinger: singer, 
      currentPage: 'singer',
      currentPlaylist: null 
    }));
  };

  const handleBackFromSinger = () => {
    setAppState(prev => ({ 
      ...prev, 
      currentSinger: null, 
      currentPage: 'home' 
    }));
  };

  const handleSongPlay = (song: Song, queue: Song[] = []) => {
    playSong(song, queue);
    setRecentSongs(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 50);
    });
  };

  const handleSongsImported = (songs: Song[]) => {
    setRecentSongs(prev => [...songs, ...prev].slice(0, 50));
  };

  const handleAIMessagesUpdate = (messages: AIMessage[]) => {
    setAppState(prev => ({ ...prev, aiChat: messages }));
  };

  const handleThemeToggle = () => {
    setAppState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const handleSettingsUpdate = (settings: any) => {
    setAppState(prev => ({ ...prev, settings }));
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(prev => !prev);
  };

  // Get all songs from all playlists and recent songs
  const getAllSongs = (): Song[] => {
    const playlistSongs = appState.playlists.flatMap(playlist => playlist.songs);
    const allSongs = [...recentSongs, ...playlistSongs];
    
    // Remove duplicates based on song ID
    const uniqueSongs = allSongs.filter((song, index, self) => 
      index === self.findIndex(s => s.id === song.id)
    );
    
    return uniqueSongs;
  };

  const handlePlaylistGenerated = async (songTitles: string[], source: 'youtube' | 'spotify' = 'youtube') => {
    setIsCreatingPlaylist(true);
    console.log('handlePlaylistGenerated called with:', songTitles, 'source:', source);
    
    // Validate input
    if (!songTitles || songTitles.length === 0) {
      console.error('No song titles provided');
      setIsCreatingPlaylist(false);
      return null;
    }
    
    try {
      const songs: Song[] = [];
      let successCount = 0;
      let failCount = 0;
      
      console.log('🎵 Starting to search for songs:', songTitles);
      
      for (const title of songTitles) {
        try {
          console.log('Searching for song:', title);
          
          if (source === 'spotify') {
            // Check if user is authenticated for Spotify
            if (spotifyAuthState.isAuthenticated && spotifyAuthState.accessToken) {
              const tracks = await spotifyApi.searchTracks(title, 1);
              if (tracks.length > 0) {
                songs.push(spotifyToSong(tracks[0]));
                successCount++;
                console.log('Found Spotify song:', tracks[0].name);
              } else {
                failCount++;
                console.log('No Spotify results for:', title);
              }
            } else {
              console.log('Spotify not authenticated, falling back to YouTube for:', title);
              const videos = await youtubeApi.searchVideos(title, 1);
              if (videos.length > 0) {
                songs.push(youtubeToSong(videos[0]));
                successCount++;
                console.log('Found YouTube song (fallback):', videos[0].title);
              } else {
                failCount++;
                console.log('No YouTube results for:', title);
              }
            }
          } else {
            const videos = await youtubeApi.searchVideos(title, 1);
            if (videos.length > 0) {
              songs.push(youtubeToSong(videos[0]));
              successCount++;
              console.log('Found YouTube song:', videos[0].title);
            } else {
              failCount++;
              console.log('No YouTube results for:', title);
            }
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failCount++;
          console.error(`Error searching for "${title}":`, error);
        }
      }

      console.log(`Search results: ${successCount} found, ${failCount} failed, ${songs.length} total songs`);
      
      if (songs.length > 0) {
        // Generate a creative playlist name
        let playlistName = `BuggyAI Playlist`;
        try {
          // Use the first song title as the mood for naming
          const moodForNaming = songTitles[0] || 'music playlist';
          playlistName = await geminiApi.generatePlaylistName(moodForNaming, songTitles);
          // Only add source suffix if it's not already in the name
          if (!playlistName.toLowerCase().includes('spotify') && !playlistName.toLowerCase().includes('youtube')) {
            playlistName = `${playlistName} (${source === 'spotify' ? 'Spotify' : 'YouTube'})`;
          }
          console.log('Generated playlist name:', playlistName);
        } catch (error) {
          console.error('Error generating playlist name:', error);
          playlistName = `BuggyAI ${source === 'spotify' ? 'Spotify' : 'YouTube'} Playlist`;
        }

        const newPlaylist: Playlist = {
          id: generateId(),
          name: playlistName,
          description: `🤖 Generated by BuggyAI • ${songs.length} songs from ${source === 'spotify' ? 'Spotify' : 'YouTube'}`,
          songs,
          createdAt: new Date(),
          updatedAt: new Date(),
          isAIGenerated: true,
          source: source
        };

        console.log('Creating new playlist:', newPlaylist);
        setAppState(prev => ({
          ...prev,
          playlists: [...prev.playlists, newPlaylist]
        }));
        
        console.log('Playlist added to state');
        
        // Return the created playlist for the AI chat component
        return newPlaylist;
      } else {
        console.error('No songs found for playlist creation. Searched for:', songTitles);
        return null;
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      return null;
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handlePlaylistUpdated = (updatedPlaylist: Playlist) => {
    const updatedPlaylists = appState.playlists.map(playlist => 
      playlist.id === updatedPlaylist.id ? updatedPlaylist : playlist
    );
    setAppState(prev => ({ ...prev, playlists: updatedPlaylists }));
  };

  const toggleFavorite = (song: Song) => {
    setFavorites(prev => {
      const isFavorite = prev.some(s => s.id === song.id);
      if (isFavorite) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const isFavorite = (song: Song) => {
    return favorites.some(s => s.id === song.id);
  };

  const handlePlayerToggleFavorite = () => {
    if (playerState.currentSong) {
      toggleFavorite(playerState.currentSong);
    }
  };

  const isCurrentSongFavorite = playerState.currentSong ? isFavorite(playerState.currentSong) : false;

  const handleAddToPlaylist = (song: Song, playlistId: string) => {
    const updatedPlaylists = appState.playlists.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if song already exists in playlist
        const songExists = playlist.songs.some(s => s.id === song.id);
        if (!songExists) {
          return {
            ...playlist,
            songs: [...playlist.songs, song],
            updatedAt: new Date()
          };
        }
      }
      return playlist;
    });
    setAppState(prev => ({ ...prev, playlists: updatedPlaylists }));
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.id === song.id);
      if (isSelected) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleLongPress = (song: Song) => {
    setMultiSelectMode(true);
    setSelectedSongs([song]);
  };

  const handleMultiSelectAddToFavorites = () => {
    selectedSongs.forEach(song => {
      if (!isFavorite(song)) {
        toggleFavorite(song);
      }
    });
    setSelectedSongs([]);
    setMultiSelectMode(false);
  };

  const handleMultiSelectRemove = () => {
    // This would be implemented based on the current context (playlist, favorites, etc.)
    setSelectedSongs([]);
    setMultiSelectMode(false);
  };

  const handleMultiSelectAddToPlaylist = (playlistId: string) => {
    selectedSongs.forEach(song => {
      handleAddToPlaylist(song, playlistId);
    });
    setSelectedSongs([]);
    setMultiSelectMode(false);
  };

  const handleClearSelection = () => {
    setSelectedSongs([]);
    setMultiSelectMode(false);
  };

  const handleExportData = () => {
    const appData: AppData = {
      playlists: appState.playlists,
      recentSongs: recentSongs,
      favorites: favorites,
      aiChat: appState.aiChat,
      settings: appState.settings,
      isDarkMode: appState.isDarkMode,
      sidebarCollapsed: sidebarCollapsed
    };
    
    const csvContent = exportDataToCSV(appData);
    const filename = `mechamusic-backup-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleImportData = async (file: File) => {
    try {
      const csvContent = await readCSVFile(file);
      const importedData = importDataFromCSV(csvContent);
      
      // Merge imported data with current data
      if (importedData.playlists) {
        setAppState(prev => ({ ...prev, playlists: importedData.playlists! }));
      }
      if (importedData.recentSongs) {
        setRecentSongs(importedData.recentSongs);
      }
      if (importedData.favorites) {
        setFavorites(importedData.favorites);
      }
      if (importedData.aiChat) {
        setAppState(prev => ({ ...prev, aiChat: importedData.aiChat! }));
      }
      if (importedData.settings) {
        setAppState(prev => ({ ...prev, settings: importedData.settings! }));
      }
      if (importedData.isDarkMode !== undefined) {
        setAppState(prev => ({ ...prev, isDarkMode: importedData.isDarkMode! }));
      }
      if (importedData.sidebarCollapsed !== undefined) {
        setSidebarCollapsed(importedData.sidebarCollapsed);
      }
      
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file format.');
    }
  };

  const renderCurrentPage = () => {
    switch (appState.currentPage) {
      case 'home':
        return (
          <HomePage
            playlists={appState.playlists}
            recentSongs={recentSongs}
            onPlaylistClick={handlePlaylistSelect}
            onSongPlay={handleSongPlay}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            spotifyAuthState={spotifyAuthState}
          />
        );
      case 'music':
        return (
          <MusicPage
            allSongs={getAllSongs()}
            onSongPlay={handleSongPlay}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            playlists={appState.playlists}
            onAddToPlaylist={handleAddToPlaylist}
            selectedSongs={selectedSongs}
            onSongSelect={handleSongSelect}
            isMultiSelectMode={multiSelectMode}
            onLongPress={handleLongPress}
            onArtistClick={handleSingerSelect}
            language={appState.settings.language}
          />
        );
      case 'playlists':
        return (
          <PlaylistsPage
            playlists={appState.playlists}
            currentPlaylist={appState.currentPlaylist}
            onPlaylistsUpdate={handlePlaylistsUpdate}
            onPlaylistSelect={handlePlaylistSelect}
            onSongPlay={handleSongPlay}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onAddToPlaylist={handleAddToPlaylist}
            selectedSongs={selectedSongs}
            onSongSelect={handleSongSelect}
            isMultiSelectMode={multiSelectMode}
            onLongPress={handleLongPress}
            onArtistClick={handleSingerSelect}
            language={appState.settings.language}
          />
        );
      case 'favorites':
        return (
          <MusicPage
            allSongs={favorites}
            onSongPlay={handleSongPlay}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            title="Favorites"
            playlists={appState.playlists}
            onAddToPlaylist={handleAddToPlaylist}
            selectedSongs={selectedSongs}
            onSongSelect={handleSongSelect}
            isMultiSelectMode={multiSelectMode}
            onLongPress={handleLongPress}
            onArtistClick={handleSingerSelect}
            language={appState.settings.language}
          />
        );
      case 'singer':
        return appState.currentSinger ? (
          <SingerPage
            singer={appState.currentSinger}
            allSongs={getAllSongs()}
            onSongPlay={handleSongPlay}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onBack={handleBackFromSinger}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            playlists={appState.playlists}
            onAddToPlaylist={handleAddToPlaylist}
            selectedSongs={selectedSongs}
            onSongSelect={handleSongSelect}
            isMultiSelectMode={multiSelectMode}
            onLongPress={handleLongPress}
            language={appState.settings.language}
          />
        ) : null;
      case 'ai-chat':
        return (
          <AIChat
            messages={appState.aiChat}
            onMessagesUpdate={handleAIMessagesUpdate}
            onPlaylistGenerated={handlePlaylistGenerated}
            onPlaylistUpdated={handlePlaylistUpdated}
            language={appState.settings.language}
            isCreatingPlaylist={isCreatingPlaylist}
            spotifyAuthState={spotifyAuthState}
            playlists={appState.playlists}
          />
        );
      case 'import':
        return (
          <ImportPage
            onSongsImported={handleSongsImported}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            isDarkMode={appState.isDarkMode}
            onThemeToggle={handleThemeToggle}
            settings={appState.settings}
            onSettingsUpdate={handleSettingsUpdate}
            onExportData={handleExportData}
            onImportData={handleImportData}
            spotifyAuthState={spotifyAuthState}
          />
        );
      default:
        return null;
    }
  };

  // Handle Spotify callback
  // No longer needed - callback is handled automatically by SpotifyAuthService

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader onLoadComplete={handleLoadComplete} />
      </div>
    );
  }

  // Mobile App - Only show on portrait mobile screens
  if (isMobile) {
    return (
      <MobileApp
        playlists={appState.playlists}
        recentSongs={recentSongs}
        favorites={favorites}
        playerState={playerState}
        currentPage={appState.currentPage}
        currentPlaylist={appState.currentPlaylist}
        spotifyAuthState={spotifyAuthState}
        onPageChange={handlePageChange}
        onPlaylistSelect={handlePlaylistSelect}
        onSongPlay={handleSongPlay}
        onTogglePlay={togglePlay}
        onNext={nextSong}
        onPrevious={previousSong}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleFavorite={handlePlayerToggleFavorite}
        isFavorite={isCurrentSongFavorite}
        onPlaylistsUpdate={handlePlaylistsUpdate}
        onSettingsUpdate={handleSettingsUpdate}
        settings={appState.settings}
        isDarkMode={appState.isDarkMode}
        onThemeToggle={handleThemeToggle}
        onPlaylistGenerated={handlePlaylistGenerated}
        aiMessages={appState.aiChat}
        onAIMessagesUpdate={handleAIMessagesUpdate}
        isCreatingPlaylist={isCreatingPlaylist}
        onSingerSelect={handleSingerSelect}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col transition-colors duration-300 overflow-hidden safe-bottom">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Navigation
            currentPage={appState.currentPage}
            onPageChange={handlePageChange}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            isMobile={false}
            mobileMenuOpen={false}
            onMobileMenuToggle={() => {}}
            language={appState.settings.language}
            spotifyAuthState={spotifyAuthState}
          />
        )}
        
        {/* Mobile Menu Button */}
        {false && (
          <button
            onClick={handleMobileMenuToggle}
            className="fixed top-4 left-4 z-50 p-3 glass text-white rounded-xl shadow-xl hover:bg-gray-800 transition-all duration-300 hover:scale-110 safe-top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Mobile Sidebar Overlay */}
        {false && (
          <>
            {/* Backdrop */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-60 z-40 animate-fade-in backdrop-blur-sm"
                onClick={handleMobileMenuToggle}
              />
            )}
            
            {/* Mobile Sidebar */}
            <div className={`fixed left-0 top-0 h-full z-50 transform transition-all duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <Navigation
                currentPage={appState.currentPage}
                onPageChange={(page) => {
                  handlePageChange(page);
                  setMobileMenuOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                isMobile={true}
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuToggle={handleMobileMenuToggle}
                language={appState.settings.language}
                spotifyAuthState={spotifyAuthState}
              />
            </div>
          </>
        )}
        
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Multi-Select Toolbar */}
      <MultiSelectToolbar
        selectedSongs={selectedSongs}
        playlists={appState.playlists}
        onAddToFavorites={handleMultiSelectAddToFavorites}
        onRemoveSelected={handleMultiSelectRemove}
        onAddToPlaylist={handleMultiSelectAddToPlaylist}
        onClearSelection={handleClearSelection}
        showRemove={appState.currentPage === 'playlists' || appState.currentPage === 'favorites'}
      />


      {/* Player Controls */}
      <PlayerControls
        playerState={playerState}
        onTogglePlay={togglePlay}
        onNext={nextSong}
        onPrevious={previousSong}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleFavorite={handlePlayerToggleFavorite}
        isFavorite={isCurrentSongFavorite}
        hideControls={appState.currentPage === 'ai-chat' || appState.currentPage === 'settings'}
      />

      {/* YouTube Player */}
      <AudioPlayer
        song={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onStateChange={updatePlayerState}
        onEnded={handleSongEnd}
        volume={playerState.volume}
        seekTime={seekTime}
      />

      {/* YouTube Player */}
      <YouTubePlayer
        song={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onStateChange={updatePlayerState}
        onEnded={handleSongEnd}
        volume={playerState.volume}
        seekTime={seekTime}
      />

      {/* Spotify Player */}
      <SpotifyWebPlayer
        song={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onStateChange={updatePlayerState}
        onEnded={handleSongEnd}
        volume={playerState.volume}
        seekTime={seekTime}
        accessToken={spotifyAuthState.accessToken}
      />

      {/* Spotify Refresh Button */}
      {renderIfDevEnabled('showSpotifyRefreshButton', 
        <SpotifyRefreshButton authState={spotifyAuthState} />
      )}

      {/* Spotify Debug Button */}
      {renderIfDevEnabled('showSpotifyDebugButton', 
        <SpotifyDebugButton authState={spotifyAuthState} />
      )}
    </div>
  );
}