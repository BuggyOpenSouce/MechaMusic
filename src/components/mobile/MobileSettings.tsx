import React from 'react';
import { ChevronRight, Moon, Sun, Volume2, Bell, Globe, Download, Upload, Music, User, LogOut } from 'lucide-react';
import { SpotifyAuthState } from '../../types';
import { spotifyAuth } from '../../services/spotifyAuth';

interface MobileSettingsProps {
  settings: any;
  onSettingsUpdate: (settings: any) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  spotifyAuthState: SpotifyAuthState;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  settings,
  onSettingsUpdate,
  isDarkMode,
  onThemeToggle,
  spotifyAuthState,
  onExportData,
  onImportData
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateSetting = (key: string, value: any) => {
    onSettingsUpdate({
      ...settings,
      [key]: value
    });
  };

  const handleSpotifyLogin = async () => {
    try {
      await spotifyAuth.login();
    } catch (error) {
      console.error('Error starting Spotify login:', error);
      alert('Failed to start Spotify login. Please try again.');
    }
  };

  const handleSpotifyLogout = () => {
    if (confirm('Are you sure you want to disconnect from Spotify?')) {
      spotifyAuth.logout();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportData) {
      onImportData(file);
    }
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          title: 'Profile',
          subtitle: 'Manage your account',
          action: () => {},
          showChevron: true
        }
      ]
    },
    {
      title: 'Playback',
      items: [
        {
          icon: Volume2,
          title: 'Volume Level',
          subtitle: `${Math.round(settings.volume * 100)}%`,
          action: () => {},
          showChevron: false,
          customControl: (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
              className="w-20 accent-green-500"
              onClick={(e) => e.stopPropagation()}
            />
          )
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDarkMode ? Moon : Sun,
          title: 'Dark Mode',
          subtitle: isDarkMode ? 'On' : 'Off',
          action: onThemeToggle,
          showToggle: true,
          toggleValue: isDarkMode
        },
        {
          icon: Bell,
          title: 'Notifications',
          subtitle: settings.showNotifications ? 'On' : 'Off',
          action: () => updateSetting('showNotifications', !settings.showNotifications),
          showToggle: true,
          toggleValue: settings.showNotifications
        },
        {
          icon: Globe,
          title: 'Language',
          subtitle: settings.language === 'en' ? 'English' : settings.language === 'tr' ? 'Türkçe' : 'Español',
          action: () => {
            const languages = ['en', 'tr', 'es'];
            const currentIndex = languages.indexOf(settings.language);
            const nextIndex = (currentIndex + 1) % languages.length;
            updateSetting('language', languages[nextIndex]);
          },
          showChevron: true
        }
      ]
    },
    {
      title: 'Spotify',
      items: spotifyAuthState.isAuthenticated ? [
        {
          icon: Music,
          title: 'Connected Account',
          subtitle: spotifyAuthState.user?.display_name || 'Spotify User',
          action: () => {},
          showChevron: false,
          customControl: (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-500 text-xs">Connected</span>
            </div>
          )
        },
        {
          icon: LogOut,
          title: 'Disconnect',
          subtitle: 'Sign out of Spotify',
          action: handleSpotifyLogout,
          showChevron: true,
          danger: true
        }
      ] : [
        {
          icon: Music,
          title: 'Connect to Spotify',
          subtitle: 'Enable playlist export and more features',
          action: handleSpotifyLogin,
          showChevron: true
        }
      ]
    },
    {
      title: 'Data',
      items: [
        {
          icon: Download,
          title: 'Export Data',
          subtitle: 'Download your playlists and settings',
          action: onExportData || (() => {}),
          showChevron: true
        },
        {
          icon: Upload,
          title: 'Import Data',
          subtitle: 'Restore from backup file',
          action: handleImportClick,
          showChevron: true
        }
      ]
    },
    {
      title: 'About',
      items: [
        {
          icon: Music,
          title: 'MechaMusic',
          subtitle: 'Version 1.0.0',
          action: () => {},
          showChevron: false
        }
      ]
    }
  ];

  return (
    <div className="flex-1 bg-black flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-12 pb-3 bg-gray-900 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">Settings</h1>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4" style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 140px)'
      }}>
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="text-white font-semibold text-sm mb-2 px-1">{section.title}</h2>
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div
                    key={itemIndex}
                    className={`flex items-center justify-between p-3 ${
                      itemIndex < section.items.length - 1 ? 'border-b border-gray-800' : ''
                    }`}
                  >
                    <button
                      onClick={item.action}
                      className={`flex items-center space-x-3 flex-1 text-left ${
                        item.danger ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${item.danger ? 'text-red-400' : 'text-white'}`}>
                          {item.title}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {item.subtitle}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center space-x-2">
                      {item.customControl && item.customControl}
                      
                      {item.showToggle && (
                        <button
                          onClick={item.action}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            item.toggleValue ? 'bg-green-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              item.toggleValue ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                      
                      {item.showChevron && (
                        <ChevronRight className={`w-4 h-4 ${item.danger ? 'text-red-400' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="py-6 text-center">
          <p className="text-gray-500 text-xs">
            Made with ❤️ by MechaMusic Team
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};