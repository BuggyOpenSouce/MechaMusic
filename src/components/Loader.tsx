import React, { useState, useEffect } from 'react';

interface LoaderProps {
  onLoadComplete?: () => void;
  text?: string;
  showProgress?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ onLoadComplete, text = 'Loading...', showProgress = true }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(text);

  useEffect(() => {
    if (!showProgress) {
      setLoadingText(text);
      return;
    }

    const loadingSteps = [
      { progress: 20, text: 'Loading components...' },
      { progress: 40, text: 'Connecting to services...' },
      { progress: 60, text: 'Loading your data...' },
      { progress: 80, text: 'Preparing interface...' },
      { progress: 100, text: 'Almost ready...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoadComplete?.();
        }, 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onLoadComplete, text, showProgress]);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-slide-down">
          MechaMusic
        </h1>
        <p className="text-gray-400 text-center text-lg animate-slide-down animation-delay-100">
          Advanced Music Player with AI
        </p>
      </div>
      
      <div className="loader mb-6 animate-slide-up animation-delay-200"></div>
      
      <div className="text-center animate-slide-up animation-delay-300">
        <p className="text-white text-base mb-2 font-medium">{loadingText}</p>
        {showProgress && (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-32 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-gray-400 text-sm font-medium min-w-10">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};