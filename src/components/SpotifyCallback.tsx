import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const SpotifyCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Spotify login...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setStatus('error');
      setMessage(`Spotify login failed: ${error}`);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return;
    }
    
    if (code) {
      setMessage('Processing Spotify authorization...');
      
      // Give the auth service time to process the callback
      const timer = setTimeout(() => {
        setStatus('success');
        setMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
          // Redirect to home page
          window.location.href = '/';
        }, 1500);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setStatus('error');
      setMessage('No authorization code received from Spotify');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }

  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center max-w-md">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="large" className="mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Connecting to Spotify</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Success!</h2>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-gray-500 text-sm">Redirecting you back to MechaMusic...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Login Failed</h2>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-gray-500 text-sm">Redirecting you back to MechaMusic...</p>
          </>
        )}
      </div>
    </div>
  );
};