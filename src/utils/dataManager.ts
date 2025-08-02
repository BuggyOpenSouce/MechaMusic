import { Playlist, Song, AIMessage } from '../types';

export interface AppData {
  playlists: Playlist[];
  recentSongs: Song[];
  favorites: Song[];
  aiChat?: AIMessage[];
  settings: {
    volume: number;
    autoPlay: boolean;
    showNotifications: boolean;
    language: 'en' | 'tr' | 'es';
    spotifyAccessToken?: string;
  };
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
}

export const exportDataToCSV = (data: AppData): string => {
  const csvRows: string[] = [];
  
  // Header
  csvRows.push('Type,ID,Name,Description,Data,CreatedAt,UpdatedAt');
  
  // Playlists
  data.playlists.forEach(playlist => {
    const playlistData = {
      songs: playlist.songs,
      isAIGenerated: playlist.isAIGenerated,
      coverImage: playlist.coverImage,
      source: playlist.source
    };
    csvRows.push(`Playlist,"${playlist.id}","${playlist.name}","${playlist.description}","${JSON.stringify(playlistData).replace(/"/g, '""')}","${playlist.createdAt}","${playlist.updatedAt}"`);
  });
  
  // Recent Songs
  data.recentSongs.forEach(song => {
    const songData = {
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail,
      source: song.source
    };
    csvRows.push(`RecentSong,"${song.id}","${song.title}","${song.artist}","${JSON.stringify(songData).replace(/"/g, '""')}","${song.addedAt}",""`);
  });
  
  // Favorites
  data.favorites.forEach(song => {
    const songData = {
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail,
      source: song.source
    };
    csvRows.push(`Favorite,"${song.id}","${song.title}","${song.artist}","${JSON.stringify(songData).replace(/"/g, '""')}","${song.addedAt}",""`);
  });
  
  // Settings
  const settingsData = {
    ...data.settings,
    isDarkMode: data.isDarkMode,
    sidebarCollapsed: data.sidebarCollapsed,
    // Include access token in exports now that it's site data
    spotifyAccessToken: data.settings.spotifyAccessToken
  };
  csvRows.push(`Settings,"settings","App Settings","User Settings","${JSON.stringify(settingsData).replace(/"/g, '""')}","${new Date().toISOString()}",""`);
  
  return csvRows.join('\n');
};

export const importDataFromCSV = (csvContent: string): Partial<AppData> => {
  const lines = csvContent.split('\n');
  const header = lines[0];
  
  if (!header.includes('Type,ID,Name,Description,Data,CreatedAt,UpdatedAt')) {
    throw new Error('Invalid CSV format');
  }
  
  const data: Partial<AppData> = {
    playlists: [],
    recentSongs: [],
    favorites: [],
    settings: {
      volume: 1,
      autoPlay: true,
      showNotifications: true,
      language: 'en'
    },
    isDarkMode: true,
    sidebarCollapsed: false
  };
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const [type, id, name, description, jsonData, createdAt, updatedAt] = parseCSVLine(line);
      const parsedData = JSON.parse(jsonData);
      
      switch (type) {
        case 'Playlist':
          data.playlists!.push({
            id: id,
            name: name,
            description: description,
            songs: parsedData.songs || [],
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
            isAIGenerated: parsedData.isAIGenerated || false,
            coverImage: parsedData.coverImage,
            source: parsedData.source
          });
          break;
          
        case 'RecentSong':
          data.recentSongs!.push({
            id: id,
            title: parsedData.title,
            artist: parsedData.artist,
            duration: parsedData.duration,
            url: parsedData.url,
            thumbnail: parsedData.thumbnail,
            source: parsedData.source,
            addedAt: new Date(createdAt)
          });
          break;
          
        case 'Favorite':
          data.favorites!.push({
            id: id,
            title: parsedData.title,
            artist: parsedData.artist,
            duration: parsedData.duration,
            url: parsedData.url,
            thumbnail: parsedData.thumbnail,
            source: parsedData.source,
            addedAt: new Date(createdAt)
          });
          break;
          
        case 'Settings':
          data.settings = {
            volume: parsedData.volume || 1,
            autoPlay: parsedData.autoPlay !== false,
            showNotifications: parsedData.showNotifications !== false,
            language: parsedData.language || 'en',
            // Import access tokens as they're now site data
            spotifyAccessToken: parsedData.spotifyAccessToken
          };
          data.isDarkMode = parsedData.isDarkMode !== false;
          data.sidebarCollapsed = parsedData.sidebarCollapsed || false;
          break;
      }
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error);
    }
  }
  
  return data;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  result.push(current);
  return result;
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};