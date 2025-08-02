import React, { useState, useEffect } from 'react';
import { Search, X, Music, Loader, Play, Pause } from 'lucide-react';
import { Song } from '../../types';
import { youtubeApi } from '../../services/youtubeApi';
import { spotifyApi } from '../../services/spotifyApi';
import { youtubeToSong, spotifyToSong } from '../../utils/helpers';
import { formatDuration } from '../../utils/helpers';

interface MobileSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: Song[];
  onSearchResults: (results: Song[]) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResults,
  onSongPlay,
  currentSong,
  isPlaying
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchSource, setSearchSource] = useState<'youtube' | 'spotify'>('youtube');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      onSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      let songs: Song[] = [];
      
      if (searchSource === 'youtube') {
        const videos = await youtubeApi.searchVideos(query, 20);
        songs = videos.map(youtubeToSong);
      } else {
        const tracks = await spotifyApi.searchTracks(query, 20);
        songs = tracks.map(spotifyToSong);
      }
      
      onSearchResults(songs);
      saveRecentSearch(query);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchSource]);

  const clearSearch = () => {
    onSearchChange('');
    onSearchResults([]);
  };

  const handleRecentSearchClick = (query: string) => {
    onSearchChange(query);
  };

  return (
    <div className="flex-1 flex flex-col bg-black h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-gray-900 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white mb-2">Search</h1>
        
        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full bg-white text-black pl-10 pr-10 py-3 rounded-full focus:outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Source Toggle */}
        <div className="flex bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setSearchSource('youtube')}
            className={`flex-1 py-1 px-2 rounded-full text-xs font-medium transition-colors ${
              searchSource === 'youtube'
                ? 'bg-white text-black'
                : 'text-gray-300'
            }`}
          >
            YouTube
          </button>
          <button
            onClick={() => setSearchSource('spotify')}
            className={`flex-1 py-1 px-2 rounded-full text-xs font-medium transition-colors ${
              searchSource === 'spotify'
                ? 'bg-white text-black'
                : 'text-gray-300'
            }`}
          >
            Spotify
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4 mobile-scroll" style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 180px)'
      }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="w-5 h-5 text-white animate-spin" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="px-4 py-3 space-y-2">
            {searchResults.map((song) => (
              <button
                key={song.id}
                onClick={() => onSongPlay(song, searchResults)}
                className="flex items-center w-full p-3 rounded-xl bg-gray-900 active:bg-gray-800 transition-colors group"
              >
                <div className="relative mr-3">
                  <img 
                    src={song.thumbnail} 
                    alt={song.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                    song.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {currentSong?.id === song.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      {isPlaying ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-3 bg-white animate-pulse" />
                            <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                       ) : (
                         <Pause className="w-4 h-4 text-white" />
                       )}
                    </div>
                  )}
                  {currentSong?.id !== song.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 rounded-lg flex items-center justify-center transition-all duration-200">
                      <Play className="w-4 h-4 text-white opacity-0 group-active:opacity-100 transition-all duration-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-white font-medium text-sm truncate mb-0.5 leading-tight">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate leading-tight">
                    {song.artist} • {formatDuration(song.duration)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-white font-medium mb-2 text-base">No results found</h3>
              <p className="text-gray-400 text-xs">
                Try searching with different keywords
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white font-bold text-sm mb-3">Recent searches</h2>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="flex items-center w-full p-3 rounded-xl active:bg-gray-800 transition-colors bg-gray-900"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                      <span className="text-white text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse Categories */}
            <div>
              <h2 className="text-white font-bold text-sm mb-3">Browse all</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Pop', color: 'from-pink-500 to-purple-500' },
                  { name: 'Rock', color: 'from-red-500 to-orange-500' },
                  { name: 'Hip Hop', color: 'from-yellow-500 to-red-500' },
                  { name: 'Electronic', color: 'from-blue-500 to-purple-500' },
                  { name: 'Jazz', color: 'from-green-500 to-blue-500' },
                  { name: 'Classical', color: 'from-purple-500 to-pink-500' },
                ].map((category) => (
                  <button
                    key={category.name}
                    onClick={() => onSearchChange(category.name)}
                    className={`h-20 rounded-xl bg-gradient-to-br ${category.color} p-3 text-left active:scale-95 transition-transform`}
                  >
                    <span className="text-white font-bold text-sm">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};