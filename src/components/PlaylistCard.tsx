import React, { useRef } from 'react';
import { Music, Bot, Camera, Upload, MoreVertical, Edit3, Trash2, Check, X } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onCoverChange?: (playlistId: string, coverImage: string) => void;
  onEdit?: (playlist: Playlist) => void;
  onDelete?: (playlistId: string) => void;
  onLongPress?: (playlist: Playlist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  playlist, 
  onClick, 
  onCoverChange,
  onEdit,
  onDelete,
  onLongPress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showContextMenu, setShowContextMenu] = React.useState(false);
  const [contextMenuPosition, setContextMenuPosition] = React.useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = React.useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate AI playlist cover from song thumbnails
  const generateAIPlaylistCover = () => {
    if (playlist.isAIGenerated && playlist.songs.length > 0) {
      // Get up to 4 random songs for the cover
      const shuffledSongs = [...playlist.songs].sort(() => Math.random() - 0.5);
      const coverSongs = shuffledSongs.slice(0, 4);
      
      return (
        <div className="grid grid-cols-2 gap-0.5 w-full aspect-square rounded-xl overflow-hidden">
          {coverSongs.map((song, index) => (
            <div key={song.id} className="aspect-square">
              <img 
                src={song.thumbnail} 
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
          {/* Fill empty slots if less than 4 songs */}
          {Array.from({ length: 4 - coverSongs.length }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square bg-gray-800 flex items-center justify-center">
              <Music className="w-4 h-4 text-gray-600" />
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCoverChange) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCoverChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onCoverChange(playlist.id, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onLongPress) {
      setIsLongPressing(true);
      longPressTimer.current = setTimeout(() => {
        onLongPress(playlist);
        setIsLongPressing(false);
      }, 500);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.right,
      y: rect.top
    });
    setShowContextMenu(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(playlist);
    }
    setShowContextMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      onDelete(playlist.id);
    }
    setShowContextMenu(false);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  return (
    <>
      <div 
        ref={cardRef}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`bg-gray-950 rounded-xl p-4 cursor-pointer hover:bg-gray-900 transition-all duration-300 hover-lift border border-gray-800 group relative overflow-hidden ${
          isLongPressing ? 'bg-gray-800 scale-95' : ''
        }`}
      >
        {/* Context Menu Button */}
        <button
          onClick={handleMoreClick}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg hover:bg-gray-800 z-10 hover:scale-110"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

      <div className="relative mb-4">
        {playlist.coverImage ? (
          <div className="relative">
            <img 
              src={playlist.coverImage} 
              alt={playlist.name}
              className="w-full aspect-square rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {onCoverChange && (
              <div 
                onClick={handleCoverClick}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" />
              </div>
            )}
          </div>
        ) : playlist.isAIGenerated && playlist.songs.length > 0 ? (
          <div 
            onClick={onCoverChange ? handleCoverClick : undefined}
            className={`relative transition-all duration-300 ${
              onCoverChange ? 'cursor-pointer group-hover:opacity-90' : ''
            }`}
          >
            {generateAIPlaylistCover()}
            {onCoverChange && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-300 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" />
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={onCoverChange ? handleCoverClick : undefined}
            className={`flex items-center justify-center w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative transition-all duration-300 ${
              onCoverChange ? 'cursor-pointer group-hover:from-gray-700 group-hover:to-gray-800' : ''
            }`}
          >
            {playlist.isAIGenerated ? (
              <Bot className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <Music className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
            )}
            {onCoverChange && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-300 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" />
              </div>
            )}
          </div>
        )}
        
        {onCoverChange && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        )}
      </div>
      
      <h3 className="text-white font-semibold mb-2 truncate text-sm group-hover:text-gray-100 transition-colors duration-200">{playlist.name}</h3>
      <p className="text-gray-400 text-xs mb-2 line-clamp-2 group-hover:text-gray-300 transition-colors duration-200">{playlist.description}</p>
      <p className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors duration-200">{playlist.songs.length} songs</p>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {playlist.isAIGenerated && (
            <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              BuggyAI
            </span>
          )}
          {playlist.source === 'spotify' && (
            <div className="flex items-center bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Spotify</span>
            </div>
          )}
          {playlist.source === 'youtube' && (
            <div className="flex items-center bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YouTube</span>
            </div>
          )}
        </div>
      </div>
      
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed glass border border-gray-700 rounded-xl shadow-2xl z-50 min-w-48 animate-scale-in"
          style={{
            left: `${Math.min(contextMenuPosition.x, window.innerWidth - 200)}px`,
            top: `${Math.min(contextMenuPosition.y, window.innerHeight - 200)}px`
          }}
        >
          <div className="py-2">
            {/* Edit Playlist */}
            {onEdit && (
              <button 
                onClick={handleEdit}
                className="w-full flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 text-sm rounded-lg mx-1"
              >
                <Edit3 className="w-4 h-4 mr-3" />
                Edit Playlist
              </button>
            )}
            
            {/* Delete Playlist */}
            {onDelete && (
              <>
                <hr className="border-gray-700 my-2 mx-2" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center px-4 py-2.5 text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition-all duration-200 text-sm rounded-lg mx-1"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Playlist
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};