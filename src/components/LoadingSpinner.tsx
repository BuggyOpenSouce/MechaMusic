import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-600 border-t-white rounded-full animate-spin`}></div>
    </div>
  );
};

interface LinearProgressProps {
  progress?: number;
  className?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({ 
  progress, 
  className = '' 
}) => {
  return (
    <div className={`w-full bg-gray-800 rounded-full h-1 overflow-hidden ${className}`}>
      <div 
        className={`h-full bg-white transition-all duration-300 ${
          progress === undefined ? 'animate-pulse' : ''
        }`}
        style={{ 
          width: progress !== undefined ? `${progress}%` : '100%',
          animation: progress === undefined ? 'loading 1s ease-in-out infinite' : undefined
        }}
      />
    </div>
  );
};