import React, { useState } from 'react';
import { Plus, Search, Grid, List, Music, Heart, Clock, Bot } from 'lucide-react';
import { Playlist, Song } from '../../types';

interface MobileLibraryProps {
  playlists: Playlist[];
  favorites: Song[];
  recentSongs: Song[];
  onPlaylistClick: (playlist: Playlist) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

export const MobileLibrary: React.FC<MobileLibraryProps> = ({
  playlists,
  favorites,
  recentSongs,
  onPlaylistClick,
  onSongPlay,
  currentSong,
  isPlaying
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filter, setFilter] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const libraryItems = [
    {
      id: 'favorites',
      name: 'Liked Songs',
      type: 'favorites',
      count: favorites.length,
      icon: Heart,
      color: 'from-purple-500 to-blue-500',
      onClick: () => {
        // Navigate to favorites page
      }
    },
    {
      id: 'recent',
      name: 'Recently Played',
      type: 'recent',
      count: recentSongs.length,
      icon: Clock,
      color: 'from-green-500 to-teal-500',
      onClick: () => {
        // Navigate to recent songs
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-12 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-white">Your Library</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 active:text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 active:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'artists', label: 'Artists' },
            { id: 'albums', label: 'Albums' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 active:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-gray-400 text-xs">
            {filteredPlaylists.length + libraryItems.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {viewMode === 'list' ? (
          <div className="space-y-1">
            {/* Special Items */}
            {libraryItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center w-full p-2 rounded-lg active:bg-gray-800 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mr-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-medium text-xs">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {item.count} songs
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Playlists */}
            {filteredPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onPlaylistClick(playlist)}
                className="flex items-center w-full p-2 rounded-lg active:bg-gray-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-2 relative overflow-hidden">
                  {playlist.coverImage ? (
                    <img 
                      src={playlist.coverImage} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : playlist.isAIGenerated && playlist.songs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                      {playlist.songs.slice(0, 4).map((song, index) => (
                        <img 
                          key={song.id}
                          src={song.thumbnail} 
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : playlist.isAIGenerated ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <Music className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium text-xs truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Playlist • {playlist.songs.length} songs
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Special Items */}
            {libraryItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="active:scale-95 transition-transform"
                >
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-xs truncate">
                    {item.name}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {item.count} songs
                  </p>
                </button>
              );
            })}

            {/* Playlists */}
            {filteredPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onPlaylistClick(playlist)}
                className="active:scale-95 transition-transform"
              >
                <div className="w-full aspect-square rounded-lg bg-gray-700 flex items-center justify-center mb-2 relative overflow-hidden">
                  {playlist.coverImage ? (
                    <img 
                      src={playlist.coverImage} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : playlist.isAIGenerated && playlist.songs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                      {playlist.songs.slice(0, 4).map((song, index) => (
                        <img 
                          key={song.id}
                          src={song.thumbnail} 
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : playlist.isAIGenerated ? (
                    <Bot className="w-8 h-8 text-white" />
                  ) : (
                    <Music className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-white font-medium text-xs truncate">
                  {playlist.name}
                </h3>
                <p className="text-gray-400 text-xs">
                  {playlist.songs.length} songs
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPlaylists.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-white font-medium mb-2 text-base">No playlists yet</h3>
              <p className="text-gray-400 text-xs mb-4">
                Create your first playlist to get started
              </p>
              <button className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm">
                Create playlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};