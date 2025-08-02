import React, { useState } from 'react';
import { ChevronLeft, Play, Shuffle, MoreHorizontal, Heart, Download } from 'lucide-react';
import { Playlist, Song } from '../../types';
import { formatDuration } from '../../utils/helpers';

interface MobilePlaylistViewProps {
  playlist: Playlist;
  onBack: () => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  playlists: Playlist[];
  onPlaylistsUpdate: (playlists: Playlist[]) => void;
}

export const MobilePlaylistView: React.FC<MobilePlaylistViewProps> = ({
  playlist,
  onBack,
  onSongPlay,
  currentSong,
  isPlaying,
  playlists,
  onPlaylistsUpdate
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const playAll = () => {
    if (playlist.songs.length > 0) {
      onSongPlay(playlist.songs[0], playlist.songs);
    }
  };

  const shufflePlay = () => {
    if (playlist.songs.length > 0) {
      const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
      onSongPlay(shuffled[0], shuffled);
    }
  };

  const totalDuration = playlist.songs.reduce((total, song) => total + song.duration, 0);

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Header */}
      <div className="relative flex-shrink-0">
        {/* Background */}
        <div className="h-72 bg-gradient-to-b from-gray-800 to-black relative overflow-hidden">
          {playlist.coverImage ? (
            <img 
              src={playlist.coverImage} 
              alt={playlist.name}
              className="w-full h-full object-cover opacity-30"
            />
          ) : playlist.isAIGenerated && playlist.songs.length > 0 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4 opacity-30">
              {playlist.songs.slice(0, 4).map((song, index) => (
                <img 
                  key={song.id}
                  src={song.thumbnail} 
                  alt={song.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ))}
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-12 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Options Button */}
        <button
          onClick={() => setShowOptions(true)}
          className="absolute top-12 right-4 p-2 bg-black/50 rounded-full backdrop-blur-sm active:scale-95 transition-transform"
        >
          <MoreHorizontal className="w-5 h-5 text-white" />
        </button>

        {/* Playlist Info */}
        <div className="absolute bottom-6 left-4 right-4">
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-gray-300 text-sm mb-3 opacity-90">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center text-gray-300 text-sm">
            <span>{playlist.songs.length} songs</span>
            {totalDuration > 0 && (
              <>
                <span className="mx-2">•</span>
                <span>{formatDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-4 py-4 flex items-center justify-between bg-black border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 active:text-white transition-colors active:scale-95">
            <Heart className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 active:text-white transition-colors active:scale-95">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 active:text-white transition-colors active:scale-95">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={shufflePlay}
            className="p-2 text-gray-400 active:text-white transition-colors active:scale-95"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={playAll}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
          >
            <Play className="w-6 h-6 text-black ml-0.5" />
          </button>
        </div>
      </div>

      {/* Songs List */}
      <div className="flex-1 overflow-y-auto mobile-scroll" style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 320px)'
      }}>
        {playlist.songs.length > 0 ? (
          <div className="px-4 py-3 space-y-1">
            {playlist.songs.map((song, index) => (
              <button
                key={song.id}
                onClick={() => onSongPlay(song, playlist.songs)}
                className="flex items-center w-full p-3 rounded-lg active:bg-gray-800 transition-colors group"
              >
                <div className="w-8 text-gray-400 text-sm font-medium mr-3">
                  {currentSong?.id === song.id && isPlaying ? (
                    <div className="flex items-center justify-center">
                      <div className="flex space-x-0.5">
                        <div className="w-1 h-3 bg-green-500 animate-pulse" />
                        <div className="w-1 h-4 bg-green-500 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  ) : (
                    <span className={currentSong?.id === song.id ? 'text-green-500' : ''}>
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="relative mr-3 group">
                  <img 
                    src={song.thumbnail} 
                    alt={song.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                    song.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {currentSong?.id !== song.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 rounded-lg flex items-center justify-center transition-all duration-200">
                      <Play className="w-4 h-4 text-white opacity-0 group-active:opacity-100 transition-all duration-200" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className={`font-medium text-sm truncate leading-tight ${
                    currentSong?.id === song.id ? 'text-green-500' : 'text-white'
                  }`}>
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate leading-tight">
                    {song.artist}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show song options
                  }}
                  className="p-2 text-gray-400 active:text-white transition-colors active:scale-95"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-white font-medium mb-2 text-base">No songs in this playlist</h3>
              <p className="text-gray-400 text-xs">
                Add some songs to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};