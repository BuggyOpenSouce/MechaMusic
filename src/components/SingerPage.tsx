import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Music, User, Clock } from 'lucide-react';
import { Song } from '../types';
import { SongItem } from './SongItem';
import { formatDuration } from '../utils/helpers';

interface SingerPageProps {
  singer: string;
  allSongs: Song[];
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onBack: () => void;
  onToggleFavorite?: (song: Song) => void;
  isFavorite?: (song: Song) => boolean;
  playlists?: any[];
  onAddToPlaylist?: (song: Song, playlistId: string) => void;
  selectedSongs?: Song[];
  onSongSelect?: (song: Song) => void;
  isMultiSelectMode?: boolean;
  onLongPress?: (song: Song) => void;
}

export const SingerPage: React.FC<SingerPageProps> = ({
  singer,
  allSongs,
  onSongPlay,
  currentSong,
  isPlaying,
  onBack,
  onToggleFavorite,
  isFavorite,
  playlists = [],
  onAddToPlaylist,
  selectedSongs = [],
  onSongSelect,
  isMultiSelectMode = false,
  onLongPress
}) => {
  const [sortBy, setSortBy] = useState<'title' | 'duration' | 'addedAt'>('addedAt');

  // Filter songs by the selected singer
  const singerSongs = allSongs.filter(song => 
    song.artist.toLowerCase() === singer.toLowerCase()
  );

  // Sort songs
  const sortedSongs = [...singerSongs].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'duration':
        return a.duration - b.duration;
      case 'addedAt':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      default:
        return 0;
    }
  });

  const playAll = () => {
    if (sortedSongs.length > 0) {
      onSongPlay(sortedSongs[0], sortedSongs);
    }
  };

  const totalDuration = singerSongs.reduce((total, song) => total + song.duration, 0);

  return (
    <div className="min-h-screen bg-black text-white animate-fade-in">
      <div className="p-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-down">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          
          <div className="flex items-center space-x-6">
            {/* Artist Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-slide-up">
              <User className="w-16 h-16 text-white" />
            </div>
            
            {/* Artist Info */}
            <div className="flex-1 animate-slide-up animation-delay-100">
              <p className="text-gray-400 text-sm mb-1">Artist</p>
              <h1 className="text-4xl font-bold text-white mb-2">{singer}</h1>
              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <span className="flex items-center">
                  <Music className="w-4 h-4 mr-1" />
                  {singerSongs.length} songs
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(totalDuration)} total
                </span>
              </div>
            </div>
            
            {/* Play Button */}
            {sortedSongs.length > 0 && (
              <button
                onClick={playAll}
                className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2 font-medium shadow-xl hover:scale-105 animate-slide-up animation-delay-200"
              >
                <Play className="w-5 h-5" />
                <span>Play All</span>
              </button>
            )}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex justify-between items-center mb-4 animate-slide-up animation-delay-300">
          <h2 className="text-xl font-semibold text-white">Songs</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-950 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-900 text-sm"
          >
            <option value="addedAt">Recently Added</option>
            <option value="title">Title</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Songs List */}
        {sortedSongs.length > 0 ? (
          <div className="bg-gray-950 rounded-xl p-4 border border-gray-900 animate-slide-up animation-delay-400">
            <div className="space-y-1">
              {sortedSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${(index * 50) + 500}ms` }}
                >
                  <SongItem
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => onSongPlay(song, sortedSongs)}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={isFavorite}
                    showIndex={true}
                    index={index}
                    playlists={playlists}
                    onAddToPlaylist={onAddToPlaylist}
                    isSelected={selectedSongs.some(s => s.id === song.id)}
                    onSelect={onSongSelect}
                    isMultiSelectMode={isMultiSelectMode}
                    onLongPress={onLongPress}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">No songs found</h2>
            <p className="text-gray-400 text-sm">
              No songs by {singer} in your library
            </p>
          </div>
        )}
      </div>
    </div>
  );
};