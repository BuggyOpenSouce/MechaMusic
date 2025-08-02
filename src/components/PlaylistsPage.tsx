import React, { useState } from 'react';
import { Plus, Search, Music, ChevronLeft, Play, Bot, Heart, TrendingUp, Edit3 } from 'lucide-react';
import { Playlist, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { SongItem } from './SongItem';
import { generateId } from '../utils/helpers';
import { useTranslation } from '../utils/translations';

interface PlaylistsPageProps {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  onPlaylistsUpdate: (playlists: Playlist[]) => void;
  onPlaylistSelect: (playlist: Playlist | null) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onToggleFavorite?: (song: Song) => void;
  isFavorite?: (song: Song) => boolean;
  onAddToPlaylist?: (song: Song, playlistId: string) => void;
  selectedSongs?: Song[];
  onSongSelect?: (song: Song) => void;
  isMultiSelectMode?: boolean;
  onLongPress?: (song: Song) => void;
  onArtistClick?: (artist: string) => void;
  language?: 'en' | 'tr' | 'es';
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({
  playlists,
  currentPlaylist,
  onPlaylistsUpdate,
  onPlaylistSelect,
  onSongPlay,
  currentSong,
  isPlaying,
  onToggleFavorite,
  isFavorite,
  onAddToPlaylist,
  selectedSongs = [],
  onSongSelect,
  isMultiSelectMode = false,
  onLongPress,
  onArtistClick,
  language = 'en',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState('');
  const [editPlaylistDescription, setEditPlaylistDescription] = useState('');
  const [editPlaylistCover, setEditPlaylistCover] = useState<string>('');
  const { t } = useTranslation(language);

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditPlaylistName(playlist.name);
    setEditPlaylistDescription(playlist.description);
    setEditPlaylistCover(playlist.coverImage || '');
  };

  const savePlaylistEdit = () => {
    if (!editingPlaylist || !editPlaylistName.trim()) return;

    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === editingPlaylist.id) {
        return {
          ...playlist,
          name: editPlaylistName.trim(),
          description: editPlaylistDescription.trim(),
          coverImage: editPlaylistCover,
          updatedAt: new Date()
        };
      }
      return playlist;
    });

    onPlaylistsUpdate(updatedPlaylists);
    setEditingPlaylist(null);
    setEditPlaylistName('');
    setEditPlaylistDescription('');
    setEditPlaylistCover('');
  };

  const cancelPlaylistEdit = () => {
    setEditingPlaylist(null);
    setEditPlaylistName('');
    setEditPlaylistDescription('');
    setEditPlaylistCover('');
  };

  const handleCoverChange = (playlistId: string, coverImage: string) => {
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          coverImage: coverImage,
          updatedAt: new Date()
        };
      }
      return playlist;
    });
    onPlaylistsUpdate(updatedPlaylists);
  };

  const handleLongPressPlaylist = (playlist: Playlist) => {
    if (window.innerWidth < 768) {
      console.log('Long press detected on playlist:', playlist.name);
    }
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: generateId(),
      name: newPlaylistName,
      description: newPlaylistDescription,
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: false
    };

    onPlaylistsUpdate([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setShowCreateForm(false);
  };

  const deletePlaylist = (playlistId: string) => {
    const playlistToDelete = playlists.find(p => p.id === playlistId);
    if (!playlistToDelete) return;

    if (confirm(`Are you sure you want to delete "${playlistToDelete.name}"?\n\nThis action cannot be undone.`)) {
      onPlaylistsUpdate(playlists.filter(p => p.id !== playlistId));
      if (currentPlaylist?.id === playlistId) {
        onPlaylistSelect(null);
      }
    }
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    try {
      const updatedPlaylists = playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            songs: playlist.songs.filter(song => song.id !== songId),
            updatedAt: new Date()
          };
        }
        return playlist;
      });
      onPlaylistsUpdate(updatedPlaylists);
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  const playAllSongs = () => {
    try {
      if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
        onSongPlay(currentPlaylist.songs[0], currentPlaylist.songs);
      }
    } catch (error) {
      console.error('Error playing all songs:', error);
    }
  };

  // Get categorized playlists
  const recentPlaylists = [...playlists]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
  
  const aiPlaylists = playlists.filter(p => p.isAIGenerated).slice(0, 6);
  
  const mostUsedPlaylists = [...playlists]
    .sort((a, b) => {
      const aScore = a.songs.length + (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) / 1000000;
      const bScore = b.songs.length + (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) / 1000000;
      return bScore - aScore;
    })
    .slice(0, 6);

  if (currentPlaylist) {
    if (!currentPlaylist.id || !currentPlaylist.name) {
      console.error('Invalid playlist data:', currentPlaylist);
      onPlaylistSelect(null);
      return null;
    }

    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="p-4 pt-16 md:pt-4 max-w-6xl mx-auto space-y-6 animate-fade-in overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
          {/* Edit Playlist Form - Inside Playlist View */}
          {editingPlaylist && editingPlaylist.id === currentPlaylist.id && (
            <div className="bg-gray-950 rounded-xl p-6 mb-6 border border-gray-900 animate-slide-down">
              <h2 className="text-lg font-semibold text-white mb-4">Edit Playlist</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={editPlaylistName}
                  onChange={(e) => setEditPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
                <textarea
                  value={editPlaylistDescription}
                  onChange={(e) => setEditPlaylistDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none transition-all duration-300"
                />
                
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Playlist Cover</label>
                  <div className="flex items-center space-x-4">
                    {editPlaylistCover && (
                      <img 
                        src={editPlaylistCover} 
                        alt="Cover preview"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            setEditPlaylistCover(result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                    {editPlaylistCover && (
                      <button
                        onClick={() => setEditPlaylistCover('')}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={savePlaylistEdit}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelPlaylistEdit}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6 animate-slide-down">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onPlaylistSelect(null)}
                className="flex items-center space-x-2 text-white bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{t('backToPlaylists')}</span>
              </button>
              <div className="flex items-center space-x-4">
                {/* Playlist Cover */}
                <div className="relative group">
                  {currentPlaylist.coverImage ? (
                    <img 
                      src={currentPlaylist.coverImage} 
                      alt={currentPlaylist.name}
                      className="w-16 h-16 rounded-xl object-cover shadow-lg"
                      loading="lazy"
                    />
                  ) : currentPlaylist.isAIGenerated && currentPlaylist.songs.length > 0 ? (
                    <div className="w-16 h-16 grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
                      {currentPlaylist.songs.slice(0, 4).map((song, index) => (
                        <img 
                          key={song.id}
                          src={song.thumbnail} 
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-white">{currentPlaylist.name}</h1>
                  <p className="text-gray-400 text-sm">{currentPlaylist.description}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {currentPlaylist.songs.length} {t('songs')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEditPlaylist(currentPlaylist)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 text-sm hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              {currentPlaylist.songs.length > 0 && (
                <button
                  onClick={playAllSongs}
                  className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2 text-sm hover:scale-105 shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  <span>{t('playAll')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Playlist Content */}
          {currentPlaylist.songs.length > 0 ? (
            <div className="bg-gray-950 rounded-xl p-4 border border-gray-900 animate-slide-up animation-delay-100">
              <div className="space-y-1">
                {currentPlaylist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SongItem
                      song={song}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                      onPlay={() => onSongPlay(song, currentPlaylist.songs)}
                      onRemove={() => removeSongFromPlaylist(currentPlaylist.id, song.id)}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={isFavorite}
                      showIndex={true}
                      index={index}
                      playlists={playlists.filter(p => p.id !== currentPlaylist.id)}
                      onAddToPlaylist={onAddToPlaylist}
                      isSelected={selectedSongs?.some(s => s.id === song.id)}
                      onSelect={onSongSelect}
                      isMultiSelectMode={isMultiSelectMode}
                      onLongPress={onLongPress}
                      onArtistClick={onArtistClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white mb-2">{t('noSongsInPlaylist')}</h2>
              <p className="text-gray-400 mb-4 text-sm">{t('addSongsToStart')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="p-0 md:p-4 md:pt-4 max-w-6xl mx-auto space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
        {/* Welcome Section */}
        <div className="mb-6 p-4 pt-16 md:pt-0">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-2">
            {t('yourPlaylists')}
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            {playlists.length} playlists in your library
          </p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 px-4 md:px-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaylists')}
              className="w-full bg-gray-950 text-white pl-9 pr-4 py-3 md:py-2 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-900 text-sm"
            />
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-white text-black px-4 py-3 md:py-2 rounded-full active:bg-gray-200 md:hover:bg-gray-200 essential-transition flex items-center justify-center space-x-2 text-sm shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createPlaylist')}</span>
          </button>
        </div>

        {/* Create Playlist Form */}
        {showCreateForm && (
          <div className="bg-gray-950 rounded-xl p-6 mb-6 border border-gray-900 mx-4 md:mx-0">
            <h2 className="text-lg font-semibold text-white mb-4">{t('createNewPlaylist')}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder={t('playlistName')}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder={t('description')}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              />
              <div className="flex space-x-3">
                <button
                  onClick={createPlaylist}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg active:bg-blue-700 md:hover:bg-blue-700 essential-transition font-medium"
                >
                  {t('create')}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg active:bg-gray-700 md:hover:bg-gray-700 essential-transition font-medium"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Playlist Form */}
        {editingPlaylist && (
          <div className="bg-gray-950 rounded-xl p-6 mb-6 border border-gray-900 mx-4 md:mx-0">
            <h2 className="text-lg font-semibold text-white mb-4">Edit Playlist</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={editPlaylistDescription}
                onChange={(e) => setEditPlaylistDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              />
              <div className="flex space-x-3">
                <button
                  onClick={savePlaylistEdit}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg active:bg-green-700 md:hover:bg-green-700 essential-transition font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelPlaylistEdit}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg active:bg-gray-700 md:hover:bg-gray-700 essential-transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Most Used Playlists */}
        {mostUsedPlaylists.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center px-4 md:px-0">
              <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
              Most Used Playlists
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 px-4 md:px-0">
              {mostUsedPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="mobile-animate mobile-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div 
                    onClick={() => onPlaylistSelect(playlist)}
                    className="bg-gray-950 rounded-lg p-2 cursor-pointer active:bg-gray-900 md:hover:bg-gray-900 essential-transition border border-gray-900 mobile-hover"
                  >
                    <div className="flex items-center justify-center w-full aspect-square bg-gray-800 rounded mb-2">
                      {playlist.isAIGenerated ? (
                        <Bot className="w-6 h-6 text-white" />
                      ) : (
                        <Music className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h3 className="text-white font-medium text-xs truncate mb-1">{playlist.name}</h3>
                    <p className="text-gray-400 text-xs">{playlist.songs.length} songs</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Generated Playlists */}
        {aiPlaylists.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center px-4 md:px-0">
              <Bot className="w-4 h-4 mr-2 text-purple-400" />
              BuggyAI Generated Playlists
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 px-4 md:px-0">
              {aiPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="mobile-animate mobile-slide-up"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <PlaylistCard
                    playlist={playlist}
                    onClick={() => onPlaylistSelect(playlist)}
                    onCoverChange={handleCoverChange}
                    onEdit={handleEditPlaylist}
                    onDelete={deletePlaylist}
                    onLongPress={handleLongPressPlaylist}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Updated */}
        {recentPlaylists.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center px-4 md:px-0">
              <Heart className="w-4 h-4 mr-2 text-red-400" />
              Recently Updated
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 px-4 md:px-0">
              {recentPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="mobile-animate mobile-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <PlaylistCard
                    playlist={playlist}
                    onClick={() => onPlaylistSelect(playlist)}
                    onCoverChange={handleCoverChange}
                    onEdit={handleEditPlaylist}
                    onDelete={deletePlaylist}
                    onLongPress={handleLongPressPlaylist}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Playlists */}
        {filteredPlaylists.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center px-4 md:px-0">
              <Music className="w-4 h-4 mr-2 text-blue-400" />
              All Playlists
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 px-4 md:px-0">
              {filteredPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="mobile-animate mobile-scale-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <PlaylistCard
                    playlist={playlist}
                    onClick={() => onPlaylistSelect(playlist)}
                    onCoverChange={handleCoverChange}
                    onEdit={handleEditPlaylist}
                    onDelete={deletePlaylist}
                    onLongPress={handleLongPressPlaylist}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12 px-4 mobile-animate mobile-fade-in">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">
              {searchTerm ? t('noPlaylistsFound') : t('noPlaylistsYet')}
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              {searchTerm ? t('tryDifferentSearch') : t('createFirstPlaylist')}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-white text-black px-6 py-3 rounded-full active:bg-gray-200 md:hover:bg-gray-200 essential-transition font-medium shadow-lg mobile-hover mobile-scale-in"
              >
                {t('createPlaylist')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};