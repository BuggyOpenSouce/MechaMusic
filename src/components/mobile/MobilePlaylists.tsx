import React, { useState } from 'react';
import { Plus, Search, Music, Bot, Play, MoreVertical } from 'lucide-react';
import { Playlist, Song } from '../../types';

interface MobilePlaylistsProps {
  playlists: Playlist[];
  onPlaylistClick: (playlist: Playlist) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaylistsUpdate: (playlists: Playlist[]) => void;
}

export const MobilePlaylists: React.FC<MobilePlaylistsProps> = ({
  playlists,
  onPlaylistClick,
  onSongPlay,
  currentSong,
  isPlaying,
  onPlaylistsUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      description: '',
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: false
    };

    onPlaylistsUpdate([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setShowCreateForm(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-white">Your Playlists</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-2 bg-white text-black rounded-full active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 p-4">
          <h2 className="text-white font-semibold mb-3 text-sm">Create New Playlist</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 bg-white text-black py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 active:scale-95 transition-transform"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                }}
                className="flex-1 bg-gray-700 text-white py-2.5 rounded-lg font-medium text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 mobile-scroll" style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 180px)'
      }}>
        {filteredPlaylists.length > 0 ? (
          <div className="space-y-2">
            {filteredPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onPlaylistClick(playlist)}
                className="flex items-center w-full p-3 rounded-xl bg-gray-900 active:bg-gray-800 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center mr-3 relative overflow-hidden">
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
                    <Bot className="w-6 h-6 text-white" />
                  ) : (
                    <Music className="w-6 h-6 text-gray-400" />
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 rounded-xl flex items-center justify-center transition-all duration-200">
                    <Play className="w-5 h-5 text-white opacity-0 group-active:opacity-100 transition-all duration-200" />
                  </div>
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-white font-medium text-sm truncate mb-1">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {playlist.songs.length} songs
                    {playlist.isAIGenerated && ' • AI Generated'}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show playlist options
                  }}
                  className="p-2 text-gray-400 active:text-white transition-colors active:scale-95"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-white font-medium mb-2 text-base">
                {searchQuery ? 'No playlists found' : 'No playlists yet'}
              </h3>
              <p className="text-gray-400 text-xs mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first playlist to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm active:scale-95 transition-transform"
                >
                  Create playlist
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};