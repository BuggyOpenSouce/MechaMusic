import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, MoreHorizontal, Trash2, Heart, Share2, Copy, Plus } from 'lucide-react';
import { Song, Playlist } from '../types';
import { formatDuration } from '../utils/helpers';
import { spotifyApi } from '../services/spotifyApi';

interface SongItemProps {
  song: Song;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  onToggleFavorite?: (song: Song) => void;
  isFavorite?: (song: Song) => boolean;
  showIndex?: boolean;
  index?: number;
  playlists?: Playlist[];
  onAddToPlaylist?: (song: Song, playlistId: string) => void;
  isSelected?: boolean;
  onSelect?: (song: Song) => void;
  isMultiSelectMode?: boolean;
  onLongPress?: (song: Song) => void;
  onArtistClick?: (artist: string) => void;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  isPlaying,
  onPlay,
  onRemove,
  onToggleFavorite,
  isFavorite,
  showIndex = false,
  index = 0,
  playlists = [],
  onAddToPlaylist,
  isSelected = false,
  onSelect,
  isMultiSelectMode = false,
  onLongPress,
  onArtistClick
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const menuRef = useRef<HTMLDivElement>(null);
  const playlistMenuRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target as Node)) {
        setShowPlaylistMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        setIsOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [song.title]);

  const handleShare = async () => {
    try {
      let shareUrl = song.url;
      
      // If it's a YouTube song, try to find the Spotify equivalent
      if (song.source === 'youtube') {
        try {
          const spotifyTrack = await spotifyApi.searchForSpotifyTrack(song.title, song.artist);
          if (spotifyTrack) {
            shareUrl = spotifyTrack.external_urls.spotify;
          }
        } catch (error) {
          console.log('Could not find Spotify equivalent, using original URL');
        }
      }
      
      if (navigator.share) {
        await navigator.share({
          title: song.title,
          text: `Check out "${song.title}" by ${song.artist}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        const platform = shareUrl.includes('spotify.com') ? 'Spotify' : 'YouTube';
        alert(`${platform} link copied to clipboard!`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setShowMenu(false);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (onAddToPlaylist) {
      onAddToPlaylist(song, playlistId);
    }
    setShowPlaylistMenu(false);
    setShowMenu(false);
  };

  const handleMouseDown = () => {
    if (onLongPress) {
      setIsLongPressing(true);
      longPressTimer.current = setTimeout(() => {
        onLongPress(song);
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

  const handleClick = (e: React.MouseEvent) => {
    if (isMultiSelectMode && onSelect) {
      e.preventDefault();
      onSelect(song);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowMenu(true);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMobile) {
      // For mobile, position menu in center of screen
      setMenuPosition({
        x: window.innerWidth / 2 - 100, // Center horizontally
        y: window.innerHeight / 2 - 150 // Center vertically
      });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: rect.right,
        y: rect.top
      });
    }
    setShowMenu(true);
  };

  const handleAddToPlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMobile) {
      // For mobile, position menu in center of screen
      setPlaylistMenuPosition({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 100
      });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setPlaylistMenuPosition({
        x: rect.right + 10,
        y: rect.top
      });
    }
    setShowPlaylistMenu(true);
  };

  const handleArtistClickInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArtistClick) {
      onArtistClick(song.artist);
    }
  };

  return (
    <>
      <div 
        className={`flex items-center space-x-3 p-3 md:p-2 rounded-lg active:bg-gray-900 md:hover:bg-gray-900 essential-transition group relative cursor-pointer ${
          isSelected ? 'bg-blue-900 bg-opacity-30 border border-blue-600' : ''
        } ${isLongPressing ? 'bg-gray-800' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {isMultiSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect && onSelect(song)}
            className="w-4 h-4 accent-blue-600 transition-transform duration-200 hover:scale-110"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {showIndex && !isMultiSelectMode && (
          <span className="text-gray-400 text-xs w-4 text-right font-medium transition-colors duration-200 group-hover:text-gray-300">
            {index + 1}
          </span>
        )}
        
        <div className="relative">
          <img 
            src={song.thumbnail} 
            alt={song.title}
            className="w-12 h-12 md:w-10 md:h-10 rounded-lg object-cover shadow-md"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-40 md:group-hover:bg-opacity-40 rounded-lg essential-transition flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-1.5 bg-white text-black rounded-full opacity-0 group-active:opacity-100 md:group-hover:opacity-100 essential-transition shadow-lg"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div 
            ref={titleRef}
            className={`text-white font-medium text-sm md:text-sm ${
              isOverflowing ? 'animate-marquee' : 'truncate'
            }`}
            title={song.title}
          >
            {song.title}
          </div>
          <p 
            className="text-gray-400 text-xs truncate mt-1 cursor-pointer active:text-blue-400 md:hover:text-blue-400"
            onClick={handleArtistClickInternal}
            title={`View ${song.artist}'s songs`}
          >
            {song.artist}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-xs font-medium min-w-10 text-right">
            {formatDuration(song.duration)}
          </span>
          
          <div className={`flex items-center space-x-1 ${
            isMultiSelectMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button 
              onClick={handleAddToPlaylistClick}
              className="p-2 md:p-1.5 text-gray-400 active:text-white md:hover:text-white essential-transition rounded-lg active:bg-gray-800 md:hover:bg-gray-800"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {onToggleFavorite && isFavorite && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(song);
                }}
                className={`p-2 md:p-1.5 essential-transition rounded-lg active:bg-gray-800 md:hover:bg-gray-800 ${
                  isFavorite(song) ? 'text-red-500 active:text-red-400 md:hover:text-red-400' : 'text-gray-400 active:text-white md:hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite(song) ? 'fill-current' : ''}`} />
              </button>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 md:p-1.5 text-gray-400 active:text-white md:hover:text-white essential-transition rounded-lg active:bg-gray-800 md:hover:bg-gray-800"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleMoreClick}
              className="p-2 md:p-1.5 text-gray-400 active:text-white md:hover:text-white essential-transition rounded-lg active:bg-gray-800 md:hover:bg-gray-800"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowMenu(false)}
            />
          )}
        <div 
          ref={menuRef}
          className={`fixed glass border border-gray-700 rounded-xl shadow-2xl z-50 min-w-48 ${
            isMobile ? 'mobile-scale-in' : 'animate-scale-in'
          }`}
          style={{
            left: isMobile ? `${menuPosition.x}px` : `${Math.min(menuPosition.x, window.innerWidth - 200)}px`,
            top: isMobile ? `${menuPosition.y}px` : `${Math.min(menuPosition.y, window.innerHeight - 200)}px`
          }}
        >
          <div className="py-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
                setShowMenu(false);
              }}
              className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm rounded-lg mx-1 ${
                isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-3" /> : <Play className="w-4 h-4 mr-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button 
              onClick={handleAddToPlaylistClick}
              className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm rounded-lg mx-1 ${
                isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 mr-3" />
              Add to Playlist
            </button>

            {onToggleFavorite && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(song);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm rounded-lg mx-1 ${
                  isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 mr-3 ${isFavorite && isFavorite(song) ? 'fill-current text-red-500' : ''}`} />
                {isFavorite && isFavorite(song) ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            )}

            {onArtistClick && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onArtistClick(song.artist);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm rounded-lg mx-1 ${
                  isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                View Artist
              </button>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm rounded-lg mx-1 ${
                isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4 mr-3" />
              Share Song
            </button>
            
            {onRemove && (
              <>
                <hr className="border-gray-700 my-2 mx-2" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center px-4 py-2.5 text-red-400 transition-all duration-200 text-sm rounded-lg mx-1 ${
                    isMobile ? 'active:bg-red-900 active:bg-opacity-30' : 'hover:bg-red-900 hover:bg-opacity-30'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Remove from List
                </button>
              </>
            )}
          </div>
        </div>
        </>
      )}

      {/* Add to Playlist Menu */}
      {showPlaylistMenu && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowPlaylistMenu(false)}
            />
          )}
        <div 
          ref={playlistMenuRef}
          className={`fixed glass border border-gray-700 rounded-xl shadow-2xl z-50 min-w-48 ${
            isMobile ? 'mobile-scale-in' : 'animate-scale-in'
          }`}
          style={{
            left: isMobile ? `${playlistMenuPosition.x}px` : `${Math.min(playlistMenuPosition.x, window.innerWidth - 200)}px`,
            top: isMobile ? `${playlistMenuPosition.y}px` : `${Math.min(playlistMenuPosition.y, window.innerHeight - 200)}px`
          }}
        >
          <div className="py-2 max-h-48 overflow-y-auto scrollbar-thin">
            <div className="px-4 py-2 text-gray-400 text-xs font-medium border-b border-gray-700 mb-1">
              Add to Playlist
            </div>
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(playlist.id);
                  }}
                  className={`w-full flex items-center px-4 py-2.5 text-gray-300 transition-all duration-200 text-sm text-left rounded-lg mx-1 ${
                    isMobile ? 'active:bg-gray-800 active:text-white' : 'hover:bg-gray-800 hover:text-white'
                  }`}
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
        </>
      )}
    </>
  );
};