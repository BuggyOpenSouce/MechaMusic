import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Heart, MoreHorizontal, Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { PlayerState } from '../types';
import { formatDuration } from '../utils/helpers';

interface PlayerControlsProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  hideControls?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  isFavorite,
  hideControls = false
}) => {
  const { currentSong, isPlaying, currentTime, duration, volume, shuffle, repeat } = playerState;
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(volume);
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldHide = !currentSong || hideControls;
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentSong?.title || '',
          text: `Check out "${currentSong?.title}" by ${currentSong?.artist}`,
          url: currentSong?.url || ''
        });
      } else {
        await navigator.clipboard.writeText(currentSong?.url || '');
        alert('Song link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      onVolumeChange(lastVolume);
      setIsMuted(false);
    } else {
      setLastVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) {
      setLastVolume(newVolume);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Mobile Player Controls */}
      <div className={`md:hidden fixed bottom-4 left-4 right-4 glass rounded-2xl shadow-2xl z-40 safe-bottom transition-all duration-500 ease-out ${
        shouldHide ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      } ${isExpanded ? 'pb-4' : 'pb-2'}`}>
        
        {/* Thin Progress Bar (always visible when collapsed) */}
        <div className={`w-full bg-gray-800 rounded-t-2xl h-1 overflow-hidden transition-opacity duration-300 ${
          isExpanded ? 'opacity-0' : 'opacity-100'
        }`}>
          <div 
            className="bg-white h-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Collapsed Controls */}
        <div className={`transition-all duration-500 ease-out ${
          isExpanded ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-20'
        }`}>
          <div className="flex items-center justify-between p-3">
            {/* Song Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative">
                <img 
                  src={currentSong?.thumbnail || ''} 
                  alt={currentSong?.title || ''}
                  className="w-10 h-10 rounded-lg object-cover shadow-lg"
                  loading="lazy"
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-950 ${
                  currentSong?.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate text-sm">{currentSong?.title || ''}</h3>
                <p className="text-gray-400 text-xs truncate">{currentSong?.artist || ''}</p>
              </div>
            </div>

            {/* Collapsed Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onPrevious}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={onTogglePlay}
                className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg hover:scale-110"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              
              <button
                onClick={onNext}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleExpanded}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg ml-2"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Controls */}
        <div className={`transition-all duration-500 ease-out ${
          isExpanded ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <div className="p-4">
            {/* Collapse Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={toggleExpanded}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Song Info */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <img 
                  src={currentSong?.thumbnail || ''} 
                  alt={currentSong?.title || ''}
                  className="w-14 h-14 rounded-xl object-cover shadow-lg"
                  loading="lazy"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-950 ${
                  currentSong?.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate text-sm leading-tight">{currentSong?.title || ''}</h3>
                <p className="text-gray-400 text-xs truncate mt-1">{currentSong?.artist || ''}</p>
                {currentSong?.source === 'spotify' && !currentSong?.previewUrl && (
                  <p className="text-yellow-400 text-xs mt-1 animate-pulse">Preview only</p>
                )}
              </div>
              {onToggleFavorite && (
                <button 
                  onClick={onToggleFavorite}
                  className={`p-2 transition-all duration-300 rounded-full hover:scale-110 ${
                    isFavorite ? 'text-red-500 bg-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <div
                className="w-full bg-gray-800 rounded-full h-2 cursor-pointer relative group transition-all duration-200 hover:h-3"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickTime = (x / rect.width) * duration;
                  onSeek(clickTime);
                }}
              >
                <div 
                  className="bg-white rounded-full h-full transition-all duration-100 relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-0 group-hover:scale-100" />
                </div>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-8 mb-4">
              <button
                onClick={onToggleShuffle}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                  shuffle ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              
              <button
                onClick={onPrevious}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={onTogglePlay}
                className="p-4 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              
              <button
                onClick={onNext}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              
              <button
                onClick={onToggleRepeat}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 relative ${
                  repeat !== 'none' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Repeat className="w-5 h-5" />
                {repeat === 'one' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-xs rounded-full flex items-center justify-center font-bold animate-scale-in">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-800 hover:scale-110"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-800 hover:scale-110">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleVolumeToggle}
                  className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-800 hover:scale-110"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-white cursor-pointer"
                />
                <span className="text-white text-xs font-medium min-w-10 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Player Controls */}
      <div className={`hidden md:block fixed bottom-4 left-4 right-4 glass rounded-2xl p-4 shadow-2xl z-40 safe-bottom transition-all duration-500 ease-out ${
        shouldHide ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Song Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative group">
              <img 
                src={currentSong?.thumbnail || ''} 
                alt={currentSong?.title || ''}
                className="w-12 h-12 rounded-xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-900 ${
                currentSong?.source === 'spotify' ? 'bg-green-500' : 'bg-red-500'
              } transition-colors duration-300`} />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium truncate text-sm transition-colors duration-200">{currentSong?.title || ''}</h3>
              <p className="text-gray-400 text-xs truncate transition-colors duration-200">{currentSong?.artist || ''}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <button
                onClick={onToggleShuffle}
                disabled={!currentSong}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  shuffle 
                    ? 'text-white bg-gray-900 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                } disabled:opacity-50`}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button
                onClick={onPrevious}
                disabled={!currentSong}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg hover:bg-gray-900"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={onTogglePlay}
                disabled={!currentSong}
                className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              <button
                onClick={onNext}
                disabled={!currentSong}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 rounded-lg hover:bg-gray-900"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              
              <button
                onClick={onToggleRepeat}
                disabled={!currentSong}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  repeat !== 'none' 
                    ? 'text-white bg-gray-900 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                } disabled:opacity-50 relative`}
              >
                <Repeat className="w-4 h-4" />
                {repeat === 'one' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white text-black text-xs rounded-full flex items-center justify-center font-bold animate-scale-in">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-gray-400 font-medium min-w-10 text-right">
                {formatDuration(currentTime)}
              </span>
              <div 
                className="flex-1 bg-gray-800 rounded-full h-1.5 cursor-pointer group relative overflow-hidden hover:h-2 transition-all duration-300"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const width = rect.width;
                  const clickTime = (x / width) * duration;
                  onSeek(clickTime);
                }}
              >
                <div 
                  className={`bg-white rounded-full transition-all duration-100 relative ${
                    isPlaying && currentTime === 0 ? 'h-1 animate-pulse' : 'h-full'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-0 group-hover:scale-100" />
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium min-w-10">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Right Side - Volume and Actions */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {onToggleFavorite && (
                <button 
                  onClick={onToggleFavorite}
                  className={`p-2 transition-all duration-300 rounded-lg hover:bg-gray-900 hover:scale-110 ${
                    isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              <button 
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-900 hover:scale-110"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-900 hover:scale-110">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            {/* Volume */}
            <div className="flex items-center space-x-2 relative">
              <button
                onClick={handleVolumeToggle}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-900 hover:scale-110"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              <div 
                className={`flex items-center space-x-2 transition-all duration-300 ${
                  showVolumeSlider ? 'opacity-100 w-24' : 'opacity-0 w-0 overflow-hidden'
                }`}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-white cursor-pointer"
                />
                <span className="text-white text-xs font-medium min-w-8 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};