import React from 'react';
import { Play, Clock, TrendingUp, Bot } from 'lucide-react';
import { Playlist, Song } from '../../types';
import { formatDuration } from '../../utils/helpers';

interface MobileHomeProps {
  playlists: Playlist[];
  recentSongs: Song[];
  onPlaylistClick: (playlist: Playlist) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

export const MobileHome: React.FC<MobileHomeProps> = ({
  playlists,
  recentSongs,
  onPlaylistClick,
  onSongPlay,
  currentSong,
  isPlaying
}) => {
  const recentPlaylists = playlists.slice(0, 6);
  const aiPlaylists = playlists.filter(p => p.isAIGenerated).slice(0, 4);
  const topSongs = recentSongs.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto bg-black mobile-scroll" style={{ 
      WebkitOverflowScrolling: 'touch', 
      overscrollBehavior: 'contain',
      height: 'calc(100vh - 140px)'
    }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-gray-900 to-black">
        <h1 className="text-lg font-bold text-white mb-1">Good evening</h1>
        <p className="text-gray-400 text-xs">What do you want to listen to?</p>
      </div>

      {/* Recently Played Playlists */}
      {recentPlaylists.length > 0 && (
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-2">
            {recentPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onPlaylistClick(playlist)}
                className="flex items-center bg-gray-800 rounded-lg p-2 active:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                  {playlist.isAIGenerated ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded" />
                  )}
                </div>
                <span className="text-white font-medium text-sm truncate flex-1">
                  {playlist.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Generated Playlists */}
      {aiPlaylists.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center px-4 mb-3">
            <Bot className="w-3.5 h-3.5 text-purple-400 mr-2" />
            <h2 className="text-base font-bold text-white">Made by BuggyAI</h2>
          </div>
          <div className="px-4">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {aiPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => onPlaylistClick(playlist)}
                  className="flex-shrink-0 w-32 active:scale-95 transition-transform"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl mb-2 flex items-center justify-center">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-sm truncate mb-1">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {playlist.songs.length} songs
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Played Songs */}
      {topSongs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center px-4 mb-3">
            <Clock className="w-3.5 h-3.5 text-green-400 mr-2" />
            <h2 className="text-base font-bold text-white">Recently played</h2>
          </div>
          <div className="px-4 space-y-2">
            {topSongs.map((song) => (
              <button
                key={song.id}
                onClick={() => onSongPlay(song, topSongs)}
                className="flex items-center w-full p-2 rounded-lg active:bg-gray-800 transition-colors group"
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
                  ) : (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 rounded-lg flex items-center justify-center transition-all duration-200">
                      <Play className="w-4 h-4 text-white opacity-0 group-active:opacity-100 transition-all duration-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-white font-medium text-sm truncate leading-tight">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate leading-tight">
                    {song.artist} • {formatDuration(song.duration)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 && recentSongs.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Welcome to MechaMusic
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Start by creating playlists or importing music
            </p>
          </div>
        </div>
      )}
    </div>
  );
};