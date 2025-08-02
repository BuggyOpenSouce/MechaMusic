import React from 'react';
import { Home, Music, MessageCircle, Download, Settings, Library, Menu, X, Heart, User } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { SpotifyAuthState } from '../services/spotifyAuth';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  language?: 'en' | 'tr' | 'es';
  spotifyAuthState?: SpotifyAuthState;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  isCollapsed, 
  onToggleCollapse,
  isMobile,
  mobileMenuOpen,
  onMobileMenuToggle,
  language = 'en',
  spotifyAuthState
}) => {
  const { t } = useTranslation(language);

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'music', label: t('yourMusic'), icon: Library },
    { id: 'playlists', label: t('playlists'), icon: Music },
    { id: 'favorites', label: t('favorites'), icon: Heart },
    { id: 'ai-chat', label: t('buggyAI'), icon: MessageCircle },
    { id: 'import', label: t('import'), icon: Download },
  ];

  return (
    <nav className={`bg-black border-r border-gray-800 flex flex-col h-full essential-transition safe-top safe-bottom ${
      isMobile 
        ? 'w-64' 
        : isCollapsed 
          ? 'w-16' 
          : 'w-64'
    } glass`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {(!isCollapsed || isMobile) && (
          <h1 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            MechaMusic
          </h1>
        )}
        {isMobile ? (
          <button
            onClick={onMobileMenuToggle}
            className="p-2 text-gray-400 active:text-white md:hover:text-white essential-transition rounded-lg active:bg-gray-900 md:hover:bg-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            {spotifyAuthState?.isAuthenticated && spotifyAuthState.user && (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 active:border-gray-600 md:hover:border-gray-600 essential-transition">
                {spotifyAuthState.user.images && spotifyAuthState.user.images[0] ? (
                  <img
                    src={spotifyAuthState.user.images[0].url}
                    alt={spotifyAuthState.user.display_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-green-600 flex items-center justify-center active:bg-green-500 md:hover:bg-green-500 essential-transition">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-2 text-gray-400 active:text-white md:hover:text-white essential-transition rounded-lg active:bg-gray-900 md:hover:bg-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin pb-32 md:pb-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-3 py-3 text-left essential-transition active:bg-gray-900 md:hover:bg-gray-900 group relative rounded-xl ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg border-r-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'} ${
                currentPage === item.id ? 'text-white' : ''
              }`} />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-3 px-3 py-2 glass text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 essential-transition pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Settings */}
      <div className="p-3 border-t border-gray-800">
        <button
          className={`w-full flex items-center px-3 py-3 essential-transition rounded-xl active:bg-gray-900 md:hover:bg-gray-900 group relative ${
            currentPage === 'settings'
              ? 'text-white bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onPageChange('settings')}
          title={isCollapsed && !isMobile ? t('settings') : undefined}
        >
          <Settings className={`w-5 h-5 ${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'} ${
            currentPage === 'settings' ? 'text-white' : ''
          }`} />
          {(!isCollapsed || isMobile) && (
            <span className="font-medium">{t('settings')}</span>
          )}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && !isMobile && (
            <div className="absolute left-full ml-3 px-3 py-2 glass text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 essential-transition pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
              {t('settings')}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};