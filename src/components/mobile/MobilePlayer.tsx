import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { PlayerState } from '../../types';
import { formatDuration } from '../../utils/helpers';

interface MobilePlayerProps {
  playerState: PlayerState;
  onClick: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
}

export const MobilePlayer: React.FC<MobilePlayerProps> = ({
  playerState,
  onClick,
  onTogglePlay,
  onNext
}) => {
  const { currentSong, isPlaying, currentTime, duration } = playerState;
  
  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-900 border-t border-gray-800 px-4 py-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 h-0.5 rounded-full mb-1.5 overflow-hidden">
        <div 
          className="bg-white h-full transition-all duration-100 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Player Content */}
      <div className="flex items-center justify-between">
        {/* Song Info */}
        <div 
          className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer active:opacity-80 transition-opacity"
          onClick={onClick}
        >
          <div className="relative">
            <img 
              src={currentSong.thumbnail} 
              alt={currentSong.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-gray-900 ${
              currentSong.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate leading-tight">
              {currentSong.title}
            </h3>
            <p className="text-gray-400 text-xs truncate leading-tight">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="p-2 text-white active:scale-95 transition-transform bg-white bg-opacity-10 rounded-full active:bg-opacity-20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-2 text-gray-400 active:text-white active:scale-95 transition-all"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};