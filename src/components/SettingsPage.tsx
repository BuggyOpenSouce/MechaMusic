import React from 'react';
import { Moon, Sun, Volume2, Bell, Play, Globe, Download, Upload, Music } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { SpotifyLoginButton } from './SpotifyLoginButton';
import { SpotifyAuthState } from '../services/spotifyAuth';

interface SettingsPageProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  settings: {
    volume: number;
    autoPlay: boolean;
    showNotifications: boolean;
    language: 'en' | 'tr' | 'es';
    spotifyAccessToken?: string;
  };
  onSettingsUpdate: (settings: any) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  spotifyAuthState: SpotifyAuthState;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onThemeToggle,
  settings,
  onSettingsUpdate,
  onExportData,
  onImportData,
  spotifyAuthState
}) => {
  const { t } = useTranslation(settings.language);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateSetting = (key: string, value: any) => {
    onSettingsUpdate({
      ...settings,
      [key]: value
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white dark:text-white mb-8">{t('settings')}</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">{t('appearance')}</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
              <div>
                <h3 className="text-white dark:text-white font-medium">{t('theme')}</h3>
                <p className="text-gray-400 dark:text-gray-400 text-sm">
                  {isDarkMode ? t('darkMode') : t('lightMode')}
                </p>
              </div>
            </div>
            
            <button
              onClick={onThemeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">{t('language')}</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-white dark:text-white" />
              <div>
                <h3 className="text-white dark:text-white font-medium">{t('language')}</h3>
                <p className="text-gray-400 dark:text-gray-400 text-sm">
                  Choose your preferred language
                </p>
              </div>
            </div>
            
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        {/* Spotify Integration */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-green-500" />
            {t('spotifyIntegration')}
          </h2>
          
          <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <h3 className="text-blue-400 font-medium text-sm mb-2">🎵 How to Export Playlists to Spotify</h3>
            <ol className="text-blue-300 text-xs space-y-1">
              <li>1. Login with your Spotify account below</li>
              <li>2. Go to Playlists and enable "Spotify" badge on any playlist</li>
              <li>3. Click "Export to Spotify" button</li>
              <li>4. Your playlist will be created in your Spotify library</li>
            </ol>
            <p className="text-blue-300 text-xs mt-2">
              <strong>Note:</strong> Spotify Premium is required for full playlist export functionality.
            </p>
          </div>
          
          <SpotifyLoginButton 
            authState={spotifyAuthState}
            onAuthStateChange={(state) => {
              console.log('Settings - Auth state changed:', state);
              // Update settings when auth state changes
              updateSetting('spotifyAccessToken', state.accessToken);
            }}
          />
          
          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-900 rounded-lg">
            <h4 className="text-white text-sm font-medium mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Authenticated: {spotifyAuthState?.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p>Has Access Token: {spotifyAuthState?.accessToken ? '✅ Yes' : '❌ No'}</p>
              <p>User: {spotifyAuthState?.user?.display_name || 'None'}</p>
              <p>Token Expires: {spotifyAuthState?.expiresAt ? new Date(spotifyAuthState.expiresAt).toLocaleString() : 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Audio */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">{t('audio')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-white dark:text-white" />
                <div>
                  <h3 className="text-white dark:text-white font-medium">{t('defaultVolume')}</h3>
                  <p className="text-gray-400 dark:text-gray-400 text-sm">Set the default playback volume</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                  className="w-20 accent-blue-600"
                />
                <span className="text-white dark:text-white text-sm w-8">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Play className="w-5 h-5 text-white dark:text-white" />
                <div>
                  <h3 className="text-white dark:text-white font-medium">{t('autoPlay')}</h3>
                  <p className="text-gray-400 dark:text-gray-400 text-sm">{t('autoPlayDesc')}</p>
                </div>
              </div>
              
              <button
                onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoPlay ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">{t('notifications')}</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-white dark:text-white" />
              <div>
                <h3 className="text-white dark:text-white font-medium">{t('showNotifications')}</h3>
                <p className="text-gray-400 dark:text-gray-400 text-sm">{t('notificationsDesc')}</p>
              </div>
            </div>
            
            <button
              onClick={() => updateSetting('showNotifications', !settings.showNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showNotifications ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-white dark:text-white" />
                <div>
                  <h3 className="text-white dark:text-white font-medium">Export Data</h3>
                  <p className="text-gray-400 dark:text-gray-400 text-sm">Download your playlists, songs, and settings as CSV</p>
                </div>
              </div>
              
              <button
                onClick={onExportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-white dark:text-white" />
                <div>
                  <h3 className="text-white dark:text-white font-medium">Import Data</h3>
                  <p className="text-gray-400 dark:text-gray-400 text-sm">Restore your data from a CSV file</p>
                </div>
              </div>
              
              <button
                onClick={handleImportClick}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* About */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white dark:text-white mb-4">{t('about')}</h2>
          
          <div className="space-y-2">
            <p className="text-white dark:text-white font-medium">MechaMusic</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm">{t('version')}</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm">
              {t('description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};