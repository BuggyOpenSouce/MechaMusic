import React from 'react';
import { Home, Search, Library, MessageCircle, Settings, Music } from 'lucide-react';

interface MobileNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  hasCurrentSong: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onPageChange,
  hasCurrentSong
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'Playlists', icon: Music },
    { id: 'ai-chat', label: 'BuggyAI', icon: MessageCircle },
  ];

  return (
    <div className={`bg-black border-t border-gray-800 px-1 py-1 ${
      hasCurrentSong ? 'pb-1' : 'pb-2'
    } safe-bottom`}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? 'text-white' 
                  : 'text-gray-400 active:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : ''}`} />
              <span className={`text-xs font-medium leading-tight truncate ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Settings Button */}
        <button
          onClick={() => onPageChange('settings')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
            currentPage === 'settings'
              ? 'text-white' 
              : 'text-gray-400 active:text-white'
          }`}
        >
          <Settings className={`w-5 h-5 mb-1 ${currentPage === 'settings' ? 'text-white' : ''}`} />
          <span className={`text-xs font-medium leading-tight truncate ${
            currentPage === 'settings' ? 'text-white' : 'text-gray-400'
          }`}>
            Settings
          </span>
        </button>
      </div>
    </div>
  );
};