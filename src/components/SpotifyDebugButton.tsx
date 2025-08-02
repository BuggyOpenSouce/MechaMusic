import React, { useState } from 'react';
import { Bug, User, X, RefreshCw } from 'lucide-react';
import { spotifyAuth, SpotifyAuthState } from '../services/spotifyAuth';

interface SpotifyDebugButtonProps {
  authState: SpotifyAuthState;
}

export const SpotifyDebugButton: React.FC<SpotifyDebugButtonProps> = ({
  authState
}) => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDebugClick = () => {
    // Log to console
    spotifyAuth.debugState();
    
    // Show debug panel
    setShowDebugPanel(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (authState.refreshToken) {
        await spotifyAuth.getAccessToken();
        console.log('Token refreshed successfully');
      } else {
        console.log('No refresh token available');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogin = async () => {
    try {
      await spotifyAuth.login();
    } catch (error) {
      console.error('Error starting login:', error);
    }
  };

  const handleLogout = () => {
    spotifyAuth.logout();
    setShowDebugPanel(false);
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getTimeUntilExpiry = (expiresAt: number | null) => {
    if (!expiresAt) return 'N/A';
    const minutes = Math.round((expiresAt - Date.now()) / 1000 / 60);
    if (minutes < 0) return 'Expired';
    return `${minutes} minutes`;
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={handleDebugClick}
        className="fixed top-4 right-16 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="Spotify Debug Info"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white text-lg font-semibold flex items-center">
                <Bug className="w-5 h-5 mr-2 text-purple-400" />
                Spotify Debug Info
              </h2>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Authentication Status */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    authState.isAuthenticated ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  Authentication Status
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Authenticated:</span>
                    <span className={authState.isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                      {authState.isAuthenticated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Has Access Token:</span>
                    <span className={authState.accessToken ? 'text-green-400' : 'text-red-400'}>
                      {authState.accessToken ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Has Refresh Token:</span>
                    <span className={authState.refreshToken ? 'text-green-400' : 'text-red-400'}>
                      {authState.refreshToken ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valid Authentication:</span>
                    <span className={spotifyAuth.isValidAuthentication() ? 'text-green-400' : 'text-red-400'}>
                      {spotifyAuth.isValidAuthentication() ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Info */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h3 className="text-white font-medium mb-2">Token Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires At:</span>
                    <span className="text-gray-300">{formatTime(authState.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Until Expiry:</span>
                    <span className="text-gray-300">{getTimeUntilExpiry(authState.expiresAt)}</span>
                  </div>
                  {authState.accessToken && (
                    <div className="mt-2">
                      <span className="text-gray-400">Access Token (first 20 chars):</span>
                      <div className="text-gray-300 font-mono text-xs bg-gray-700 p-2 rounded mt-1">
                        {authState.accessToken.substring(0, 20)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              {authState.user && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    User Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Display Name:</span>
                      <span className="text-gray-300">{authState.user.display_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-gray-300">{authState.user.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-gray-300">{authState.user.country || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Product:</span>
                      <span className="text-gray-300">{authState.user.product || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Followers:</span>
                      <span className="text-gray-300">{authState.user.followers?.total || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h3 className="text-white font-medium mb-3">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDebugClick}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Log to Console
                  </button>
                  
                  {authState.refreshToken && (
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Refresh Token</span>
                    </button>
                  )}
                  
                  {!authState.isAuthenticated && (
                    <button
                      onClick={handleLogin}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Login
                    </button>
                  )}
                  
                  {authState.isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>

              {/* Raw State */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h3 className="text-white font-medium mb-2">Raw State (JSON)</h3>
                <pre className="text-xs text-gray-300 bg-gray-700 p-2 rounded overflow-x-auto">
                  {JSON.stringify(authState, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};