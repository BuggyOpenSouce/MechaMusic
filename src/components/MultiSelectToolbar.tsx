import React from 'react';
import { Heart, Trash2, Plus, X } from 'lucide-react';
import { Song, Playlist } from '../types';

interface MultiSelectToolbarProps {
  selectedSongs: Song[];
  playlists: Playlist[];
  onAddToFavorites: () => void;
  onRemoveSelected: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  onClearSelection: () => void;
  showRemove?: boolean;
}

export const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  selectedSongs,
  playlists,
  onAddToFavorites,
  onRemoveSelected,
  onAddToPlaylist,
  onClearSelection,
  showRemove = false
}) => {
  const [showPlaylistMenu, setShowPlaylistMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPlaylistMenu(false);
      }
    };

    if (showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlaylistMenu]);

  if (selectedSongs.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-24 left-4 right-4 glass border border-gray-700 rounded-xl p-4 shadow-2xl z-30 animate-slide-up safe-bottom">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-white font-semibold text-sm">
            {selectedSongs.length} selected
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddToFavorites}
              className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              title="Add to Favorites"
            >
              <Heart className="w-4 h-4" />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                title="Add to Playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              {showPlaylistMenu && (
                <div className="absolute bottom-full mb-3 left-0 glass border border-gray-700 rounded-xl shadow-2xl z-50 min-w-48 animate-scale-in">
                  <div className="py-2 max-h-48 overflow-y-auto scrollbar-thin">
                    <div className="px-4 py-2 text-gray-400 text-xs font-medium border-b border-gray-700 mb-1">
                      Add to Playlist
                    </div>
                    {playlists.length > 0 ? (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => {
                            onAddToPlaylist(playlist.id);
                            setShowPlaylistMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 text-sm text-left rounded-lg mx-1"
                        >
                          <span className="truncate">{playlist.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        No playlists available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {showRemove && (
              <button
                onClick={onRemoveSelected}
                className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                title="Remove Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={onClearSelection}
          className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-800 hover:scale-110"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};