import React, { useState } from 'react';
import { Search, Link, Upload, AlertCircle, Wifi, WifiOff, Music } from 'lucide-react';
import { youtubeApi } from '../services/youtubeApi';
import { spotifyApi } from '../services/spotifyApi';
import { youtubeToSong, spotifyToSong } from '../utils/helpers';
import { Song } from '../types';
import { LoadingSpinner, LinearProgress } from './LoadingSpinner';
import { SongItem } from './SongItem';

interface ImportPageProps {
  onSongsImported: (songs: Song[]) => void;
}

export const ImportPage: React.FC<ImportPageProps> = ({ onSongsImported }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isApiWorking, setIsApiWorking] = useState(true);
  const [searchSource, setSearchSource] = useState<'youtube' | 'spotify'>('youtube');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      let songs: Song[] = [];
      
      if (searchSource === 'youtube') {
        const videos = await youtubeApi.searchVideos(searchQuery, 20);
        songs = videos.map(youtubeToSong);
        setIsApiWorking(videos.length > 0 && !videos[0].id.startsWith('mock_'));
        
        if (videos.length > 0 && videos[0].id.startsWith('mock_')) {
          setError('YouTube API is currently unavailable. Showing sample results. The actual videos may not play correctly.');
        }
      } else {
        const tracks = await spotifyApi.searchTracks(searchQuery, 20);
        songs = tracks.map(spotifyToSong);
        setIsApiWorking(tracks.length > 0);
      }
      
      setSearchResults(songs);
    } catch (error) {
      console.error('Error searching videos:', error);
      setError(`Failed to search ${searchSource}. Please check your internet connection and try again.`);
      setIsApiWorking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const videoId = youtubeApi.extractVideoId(urlInput);
      const playlistId = youtubeApi.extractPlaylistId(urlInput);
      const spotifyTrackId = spotifyApi.extractTrackId(urlInput);
      const spotifyPlaylistId = spotifyApi.extractPlaylistId(urlInput);

      if (videoId) {
        const video = await youtubeApi.getVideoDetails(videoId);
        if (video) {
          const song = youtubeToSong(video);
          onSongsImported([song]);
          setUrlInput('');
          
          if (video.id === videoId && video.title === 'Video Title (API Unavailable)') {
            setError('YouTube API is currently unavailable. The imported video may not play correctly.');
            setIsApiWorking(false);
          }
        }
      } else if (spotifyTrackId) {
        const track = await spotifyApi.getTrack(spotifyTrackId);
        if (track) {
          const song = spotifyToSong(track);
          onSongsImported([song]);
          setUrlInput('');
        }
      } else if (playlistId) {
        const videos = await youtubeApi.getPlaylistItems(playlistId);
        if (videos.length > 0) {
          const songs = videos.map(youtubeToSong);
          onSongsImported(songs);
          setUrlInput('');
        } else {
          setError('No videos found in the playlist or playlist is private/unavailable.');
        }
      } else if (spotifyPlaylistId) {
        const tracks = await spotifyApi.getPlaylistTracks(spotifyPlaylistId);
        if (tracks.length > 0) {
          const songs = tracks.map(spotifyToSong);
          onSongsImported(songs);
          setUrlInput('');
        } else {
          setError('No tracks found in the Spotify playlist or playlist is private/unavailable.');
        }
      } else {
        setError('Invalid URL. Please enter a valid YouTube or Spotify URL.');
      }
    } catch (error) {
      console.error('Error importing from URL:', error);
      setError('Failed to import from URL. Please check the URL and try again.');
      setIsApiWorking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const importSelectedSongs = () => {
    const songsToImport = searchResults.filter(song => selectedSongs.has(song.id));
    if (songsToImport.length > 0) {
      onSongsImported(songsToImport);
      setSelectedSongs(new Set());
      setSearchResults([]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Import Music</h1>

      {/* API Status Indicator */}
      <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
        isApiWorking 
          ? 'bg-green-900 bg-opacity-30 border border-green-700' 
          : 'bg-yellow-900 bg-opacity-30 border border-yellow-700'
      }`}>
        {isApiWorking ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">YouTube API is working normally</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">YouTube API is experiencing issues - using fallback mode</span>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* URL Import */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Import from URL
        </h2>
        <div className="flex space-x-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste YouTube or Spotify URL..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          <button
            onClick={handleUrlImport}
            disabled={isLoading || !urlInput.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {isLoading ? <LoadingSpinner size="small" /> : 'Import'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Search {searchSource === 'youtube' ? 'YouTube' : 'Spotify'}
        </h2>
        
        {/* Source Selection */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setSearchSource('youtube')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
              searchSource === 'youtube'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube</span>
          </button>
          <button
            onClick={() => setSearchSource('spotify')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
              searchSource === 'spotify'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Spotify</span>
          </button>
        </div>
        
        <div className="flex space-x-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${searchSource === 'youtube' ? 'YouTube' : 'Spotify'} for songs, artists, or albums...`}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {isLoading ? <LoadingSpinner size="small" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mb-6">
          <LinearProgress />
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Search Results</h2>
            {selectedSongs.size > 0 && (
              <button
                onClick={importSelectedSongs}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Import Selected ({selectedSongs.size})
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {searchResults.map((song) => (
              <div key={song.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedSongs.has(song.id)}
                  onChange={() => toggleSongSelection(song.id)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <div className="flex-1">
                  <SongItem
                    song={song}
                    isPlaying={false}
                    onPlay={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {!isApiWorking && searchResults.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Note: These are sample results due to API limitations. Actual playback may not work.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};