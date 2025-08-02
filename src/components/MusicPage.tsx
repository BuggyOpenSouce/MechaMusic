import React, { useState } from 'react';
import { Search, Music, Play, Pause, Grid, List, ChevronLeft, MoreVertical, Heart, Plus } from 'lucide-react';
import { Song, Playlist } from '../types';
import { SongItem } from './SongItem';
import { useTranslation } from '../utils/translations';
import { formatDuration } from '../utils/helpers';

interface MusicPageProps {
  allSongs: Song[];
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onToggleFavorite?: (song: Song) => void;
  isFavorite?: (song: Song) => boolean;
  title?: string;
  playlists?: Playlist[];
  onAddToPlaylist?: (song: Song, playlistId: string) => void;
  selectedSongs?: Song[];
  onSongSelect?: (song: Song) => void;
  isMultiSelectMode?: boolean;
  onLongPress?: (song: Song) => void;
  onArtistClick?: (artist: string) => void;
  language?: 'en' | 'tr' | 'es';
  onRemoveSong?: (song: Song) => void;
}

export const MusicPage: React.FC<MusicPageProps> = ({
  allSongs,
  onSongPlay,
  currentSong,
  isPlaying,
  onToggleFavorite,
  isFavorite,
  title = 'Your Music',
  playlists = [],
  onAddToPlaylist,
  selectedSongs = [],
  onSongSelect,
  isMultiSelectMode = false,
  onLongPress,
  onArtistClick,
  language = 'en',
  onRemoveSong
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'addedAt' | 'alphabetical'>('addedAt');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t } = useTranslation(language);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'duration':
        return a.duration - b.duration;
      case 'addedAt':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const playAll = () => {
    if (sortedSongs.length > 0) {
      onSongPlay(sortedSongs[0], sortedSongs);
    }
  };

  // Mobile optimized song item
  const MobileSongItem: React.FC<{ song: Song; index: number }> = ({ song, index }) => (
    <div className="flex items-center p-3 mobile-hover essential-transition mobile-animate">
      {/* Song Image */}
      <div className="relative flex-shrink-0 mr-3">
        <img 
          src={song.thumbnail} 
          alt={song.title}
          className="w-12 h-12 rounded-lg object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 active:bg-opacity-40 rounded-lg flex items-center justify-center essential-transition">
          <button
            onClick={() => onSongPlay(song, sortedSongs)}
            className="p-2 bg-white text-black rounded-full opacity-0 active:opacity-100 essential-transition mobile-scale-in"
          >
            {currentSong?.id === song.id && isPlaying ? 
              <Pause className="w-3 h-3" /> : 
              <Play className="w-3 h-3 ml-0.5" />
            }
          </button>
        </div>
      </div>
      
      {/* Song Info */}
      <div className="flex-1 min-w-0 mr-3">
        <h3 className="text-white font-medium text-sm truncate leading-tight">
          {song.title}
        </h3>
        <p className="text-gray-400 text-xs truncate mt-0.5">
          {song.artist}
        </p>
      </div>
      
      {/* Duration and Actions */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="text-gray-400 text-xs">
          {formatDuration(song.duration)}
        </span>
        <button 
          className="p-2 text-gray-400 active:text-white essential-transition mobile-hover"
          onClick={(e) => {
            e.stopPropagation();
            // Show context menu for mobile
            const rect = e.currentTarget.getBoundingClientRect();
            // You can implement a mobile-friendly context menu here
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Mobile Header - No padding */}
        <div className="sticky top-0 bg-black z-10 border-b border-gray-800">
          <div className="p-4 pb-2">
            <h1 className="text-xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">{allSongs.length} {t('songs')}</p>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchYourMusic')}
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="addedAt">Recent</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="alphabetical">A-Z</option>
              </select>
              
              <div className="flex bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {sortedSongs.length > 0 && (
              <button
                onClick={playAll}
                className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
              >
                <Play className="w-3 h-3" />
                <span>Play All</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pb-32">
          {sortedSongs.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {sortedSongs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => onSongPlay(song, sortedSongs)}
                    className="bg-gray-900 rounded-xl p-3 active:bg-gray-800 essential-transition"
                  >
                    <img 
                      src={song.thumbnail} 
                      alt={song.title}
                      className="w-full aspect-square rounded-lg object-cover mb-2"
                      loading="lazy"
                    />
                    <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
                    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {sortedSongs.map((song, index) => (
                  <MobileSongItem key={song.id} song={song} index={index} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16 px-4">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? t('noSongsFound') : t('noMusicInLibrary')}
              </h2>
              <p className="text-gray-400 text-sm">
                {searchTerm ? t('tryDifferentSearch') : t('importMusicToStart')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version remains the same
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-gray-400 text-sm">{allSongs.length} {t('songs')} {t('inYourLibrary')}</p>
        </div>
        
        {sortedSongs.length > 0 && (
          <button
            onClick={playAll}
            className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2 text-sm hover:scale-105 shadow-lg"
          >
            <Play className="w-4 h-4" />
            <span>{t('playAll')}</span>
          </button>
        )}
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchYourMusic')}
            className="w-full bg-gray-950 text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-900 text-sm transition-all duration-300"
          />
        </div>
        
        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-950 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-900 text-sm transition-all duration-300"
          >
            <option value="addedAt">{t('recentlyAdded')}</option>
            <option value="title">{t('title')}</option>
            <option value="artist">{t('artist')}</option>
            <option value="duration">{t('duration')}</option>
            <option value="alphabetical">{t('alphabetical')}</option>
          </select>
          
          <div className="flex bg-gray-950 rounded-lg border border-gray-900 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {sortedSongs.length > 0 ? (
        <div className="bg-gray-950 rounded-xl p-4 border border-gray-900">
          <div className="space-y-1">
            {sortedSongs.map((song, index) => (
              <SongItem
                key={song.id}
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
                onArtistClick={onArtistClick}
                onRemove={onRemoveSong ? () => onRemoveSong(song) : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? t('noSongsFound') : t('noMusicInLibrary')}
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            {searchTerm ? t('tryDifferentSearch') : t('importMusicToStart')}
          </p>
        </div>
      )}
    </div>
  );
};