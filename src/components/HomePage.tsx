import React from 'react';
import { Music, Bot, Clock, Play, TrendingUp, Heart } from 'lucide-react';
import { Playlist, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { SongItem } from './SongItem';

interface HomePageProps {
  playlists: Playlist[];
  recentSongs: Song[];
  onPlaylistClick: (playlist: Playlist) => void;
  onSongPlay: (song: Song, queue: Song[]) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  favorites?: Song[];
  spotifyAuthState?: any;
}

export const HomePage: React.FC<HomePageProps> = ({
  playlists,
  recentSongs,
  onPlaylistClick,
  onSongPlay,
  currentSong,
  isPlaying,
  favorites = [],
  spotifyAuthState
}) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading for smooth entrance
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Get most listened songs (using recent songs as proxy for now)
  const mostListenedSongs = recentSongs.slice(0, 6);
  
  // Get most used playlists (by song count and recent updates)
  const mostUsedPlaylists = [...playlists]
    .sort((a, b) => {
      const aScore = a.songs.length + (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) / 1000000;
      const bScore = b.songs.length + (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) / 1000000;
      return bScore - aScore;
    })
    .slice(0, 6);
    
  const recentPlaylists = playlists.slice(0, 6);
  const aiPlaylists = playlists.filter(p => p.isAIGenerated).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer w-32 h-8 rounded-lg mb-4 mx-auto"></div>
          <div className="loading-shimmer w-48 h-4 rounded mb-8 mx-auto"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-shimmer aspect-square rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="p-0 md:p-4 md:pt-6 max-w-7xl mx-auto space-y-6 md:space-y-8 overflow-y-auto scrollbar-thin">
        {/* Welcome Section */}
        <div className="p-4 pt-16 md:pt-0 mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-3">
                   MechaMusic
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Hg.
          </p>
        </div>

        {/* Most Listened Songs */}
        {mostListenedSongs.length > 0 && (
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center px-4 md:px-0">
              <TrendingUp className="w-5 h-5 mr-3 text-green-400" />
              En çok dinlediğin
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8 px-4 md:px-0">
              {mostListenedSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="hover-lift"
                >
                  <div 
                    onClick={() => onSongPlay(song, mostListenedSongs)}
                    className="bg-gray-950 rounded-xl p-3 cursor-pointer active:bg-gray-900 md:hover:bg-gray-900 essential-transition border border-gray-800 group relative overflow-hidden mobile-animate mobile-hover"
                  >
                    <div className="relative mb-3">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title}
                        className="w-full aspect-square rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 md:group-hover:bg-opacity-40 rounded-lg essential-transition flex items-center justify-center">
                        <button className="p-3 bg-white text-black rounded-full opacity-0 group-active:opacity-100 md:group-hover:opacity-100 essential-transition shadow-xl mobile-scale-in">
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-white font-medium text-sm truncate mb-1">{song.title}</h3>
                    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Most Used Playlists */}
        {mostUsedPlaylists.length > 0 && (
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center px-4 md:px-0">
              <Music className="w-5 h-5 mr-3 text-blue-400" />
              Manyaklar gibi dinlediğin playlistlerin
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8 px-4 md:px-0">
              {mostUsedPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="hover-lift"
                >
                  <div 
                    onClick={() => {
                      onPlaylistClick(playlist);
                    }}
                    className="bg-gray-950 rounded-xl p-3 cursor-pointer active:bg-gray-900 md:hover:bg-gray-900 essential-transition border border-gray-800 group"
                  >
                    <div className="flex items-center justify-center w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-3">
                      {playlist.isAIGenerated ? (
                        <Bot className="w-8 h-8 text-white" />
                      ) : (
                        <Music className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-white font-medium text-sm truncate mb-1">{playlist.name}</h3>
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
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center px-4 md:px-0">
              <Bot className="w-5 h-5 mr-3 text-purple-400" />
              BuggyAI (canım yapay zekamın) Recommendations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 md:mb-8 px-4 md:px-0">
              {aiPlaylists.map((playlist, index) => (
                <div
                  key={playlist.id}
                  className="hover-lift"
                >
                  <PlaylistCard
                    playlist={playlist}
                    onClick={() => onPlaylistClick(playlist)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Played */}
        {recentSongs.length > 6 && (
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center px-4 md:px-0">
              <Clock className="w-5 h-5 mr-3 text-orange-400" />
              Recetly Played
            </h2>
            <div className="bg-gray-950 rounded-xl p-0 md:p-4 border-0 md:border border-gray-800 mx-4 md:mx-0">
              <div className="space-y-1">
                {recentSongs.slice(6, 12).map((song, index) => (
                  <div
                    key={song.id}
                    className="active:bg-gray-900 md:hover:bg-gray-900 rounded-lg essential-transition"
                  >
                    <SongItem
                      song={song}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                      onPlay={() => onSongPlay(song, recentSongs)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {playlists.length === 0 && recentSongs.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">Welcome to MechaMusic</h2>
            <p className="text-gray-400 mb-8 text-base max-w-md mx-auto leading-relaxed">
              Yapay zekamdan playlist iste veya yt den içe aktar
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
              <button className="btn-primary">
                Create Playlist
              </button>
              <button className="btn-secondary">
                Import Music
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};