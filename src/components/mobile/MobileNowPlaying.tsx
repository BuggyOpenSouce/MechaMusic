import React, { useState } from 'react';
import { ChevronDown, MoreHorizontal, Heart, Share2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from 'lucide-react';
import { PlayerState } from '../../types';
import { formatDuration } from '../../utils/helpers';

interface MobileNowPlayingProps {
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export const MobileNowPlaying: React.FC<MobileNowPlayingProps> = ({
  playerState,
  onClose,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  isFavorite
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const { currentSong, isPlaying, currentTime, duration, volume, shuffle, repeat } = playerState;

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    onSeek(clickTime);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-black z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-10 pb-3">
        <button
          onClick={onClose}
          className="p-1.5 text-white active:scale-95 transition-transform"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white text-xs font-medium">Playing from playlist</p>
          <p className="text-gray-400 text-xs">Your Library</p>
        </div>
        <button className="p-1.5 text-white active:scale-95 transition-transform">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="relative w-full max-w-xs aspect-square">
          <img 
            src={currentSong.thumbnail} 
            alt={currentSong.title}
            className="w-full h-full object-cover rounded-xl shadow-2xl"
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black ${
            currentSong.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {/* Song Info */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg font-bold truncate mb-0.5 leading-tight">
              {currentSong.title}
            </h1>
            <p className="text-gray-400 text-sm truncate">
              {currentSong.artist}
            </p>
          </div>
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 ml-3 active:scale-95 transition-transform ${
              isFavorite ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="w-full bg-gray-700 h-1 rounded-full cursor-pointer mb-1"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-white h-full rounded-full transition-all duration-100 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex justify-between text-gray-400 text-xs">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onToggleShuffle}
            className={`p-2 active:scale-95 transition-transform ${
              shuffle ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevious}
            className="p-2 text-white active:scale-95 transition-transform"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black" />
            ) : (
              <Play className="w-6 h-6 text-black ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-white active:scale-95 transition-transform"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-2 active:scale-95 transition-transform relative ${
              repeat !== 'none' ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <button className="p-1.5 text-gray-400 active:text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-1.5 text-gray-400 active:text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            
            {showVolumeSlider && (
              <div className="flex items-center space-x-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-white"
                />
                <span className="text-white text-xs min-w-6">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};