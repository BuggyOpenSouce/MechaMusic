import React, { useState } from 'react';
import { RefreshCw, Music } from 'lucide-react';
import { spotifyAuth, SpotifyAuthState } from '../services/spotifyAuth';

interface SpotifyRefreshButtonProps {
  authState: SpotifyAuthState;
}

export const SpotifyRefreshButton: React.FC<SpotifyRefreshButtonProps> = ({
  authState
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      if (authState.isAuthenticated && authState.refreshToken) {
        // Force refresh the token
        await spotifyAuth.getAccessToken();
        console.log('Token refreshed successfully');
      } else {
        // If not authenticated, start login flow
        await spotifyAuth.login();
      }
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      alert('Failed to refresh Spotify token. Please try logging in again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Only show if user has some Spotify connection or if they need to connect
  if (!authState.isAuthenticated && !authState.refreshToken) {
    return null;
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
        authState.isAuthenticated 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={authState.isAuthenticated ? 'Refresh Spotify Token' : 'Reconnect to Spotify'}
    >
      {isRefreshing ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : authState.isAuthenticated ? (
        <RefreshCw className="w-5 h-5" />
      ) : (
        <Music className="w-5 h-5" />
      )}
    </button>
  );
};