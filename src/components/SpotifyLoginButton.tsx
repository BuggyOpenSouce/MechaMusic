import React from 'react';
import { Music, LogOut, User } from 'lucide-react';
import { spotifyAuth, SpotifyAuthState } from '../services/spotifyAuth';

interface SpotifyLoginButtonProps {
  authState: SpotifyAuthState;
  onAuthStateChange?: (state: SpotifyAuthState) => void;
}

export const SpotifyLoginButton: React.FC<SpotifyLoginButtonProps> = ({
  authState,
  onAuthStateChange
}) => {
  const handleLogin = async () => {
    try {
      console.log('Starting Spotify login...');
      await spotifyAuth.login();
    } catch (error) {
      console.error('Error starting Spotify login:', error);
      alert(`Failed to start Spotify login: ${error.message}. Please ensure popups are allowed for this site and try again.`);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to disconnect from Spotify? This will remove your saved login.')) {
      console.log('Logging out from Spotify...');
      spotifyAuth.logout();
    }
  };

  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              {authState.user.images && authState.user.images[0] ? (
                <img
                  src={authState.user.images[0].url}
                  alt={authState.user.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">
                {authState.user.display_name || 'Spotify User'}
              </h3>
              <p className="text-gray-400 text-xs">{authState.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Logout from Spotify"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center text-green-400 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span>Connected to Spotify</span>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          You can now create playlists and export to Spotify
        </div>
        
        {/* Connection Details */}
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
          <div className="text-gray-400 mb-1">Connection Details:</div>
          <div className="text-gray-300">
            Token expires: {authState.expiresAt ? new Date(authState.expiresAt).toLocaleString() : 'Unknown'}
          </div>
          <div className="text-gray-300">
            Product: {authState.user?.product || 'Unknown'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Music className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-white font-medium mb-2">Connect to Spotify</h3>
        <p className="text-gray-400 text-sm mb-4">
          Login with your Spotify account to create playlists and export your music
        </p>
        <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-xs">
          <div className="text-blue-300 mb-1">📝 Login Instructions:</div>
          <ol className="text-blue-300 space-y-1">
            <li>1. Click "Login with Spotify" below</li>
            <li>2. You'll be redirected to Spotify</li>
            <li>3. Login and authorize MechaMusic</li>
            <li>4. You'll be redirected back automatically</li>
          </ol>
          <div className="text-blue-300 mt-2">
            <strong>Note:</strong> Make sure popups are enabled for this site.
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Login with Spotify</span>
        </button>
      </div>
    </div>
  );
};