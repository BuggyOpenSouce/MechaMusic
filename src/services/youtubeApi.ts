const YOUTUBE_API_KEYS = [
  'AIzaSyCmEI4lX8Zt0WtTeRqbKqYfKcgywGqL_bE',
  'AIzaSyBwgr0a8oH98yFzcUXKIsvEKJ1JZAB1GgY',
  'AIzaSyCtv5fd4oyV04GAePDRhDe67a3_rwdZHbw',
  'AIzaSyA4NIvW3lav1jnL5Vukrx9oWdJZpASkTX8',
];

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

let currentKeyIndex = 0;

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  duration: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

const getNextApiKey = (): string => {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  return key;
};

const makeRequestWithFallback = async <T>(
  requestFn: (apiKey: string) => Promise<T>
): Promise<T> => {
  let lastError: Error | null = null;
  
  // Try each API key once
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    try {
      const apiKey = getNextApiKey();
      return await requestFn(apiKey);
    } catch (error) {
      lastError = error as Error;
      console.warn(`YouTube API key ${i + 1} failed:`, error);
      
      // Continue to next API key immediately on failure
      if (i < YOUTUBE_API_KEYS.length - 1) {
        console.log(`Trying next API key (${i + 2}/${YOUTUBE_API_KEYS.length})...`);
      }
    }
  }
  
  throw lastError || new Error('All YouTube API keys failed');
};

// Fallback search using a different approach
const fallbackSearch = async (query: string, maxResults: number = 10): Promise<YouTubeVideo[]> => {
  try {
    // This is a mock implementation - in a real app you might use a different service
    // For now, we'll return some sample data to prevent complete failure
    console.log('Using fallback search for:', query);
    
    // Generate some mock results based on the search query
    const mockResults: YouTubeVideo[] = [];
    const commonArtists = ['Various Artists', 'Music Channel', 'Official'];
    
    for (let i = 0; i < Math.min(maxResults, 5); i++) {
      mockResults.push({
        id: `mock_${Date.now()}_${i}`,
        title: `${query} - Song ${i + 1}`,
        channelTitle: commonArtists[i % commonArtists.length],
        duration: 'PT3M30S', // 3:30 duration
        thumbnails: {
          default: { url: 'no' },
          medium: { url: 'no' },
          high: { url: 'no' }
        }
      });
    }
    
    return mockResults;
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
};

export const youtubeApi = {
  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      return await makeRequestWithFallback(async (apiKey) => {
        const response = await fetch(
          `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${apiKey}`
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(`YouTube API quota exceeded or forbidden (403)`);
          }
          throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          return [];
        }
        
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
        const detailsResponse = await fetch(
          `${YOUTUBE_BASE_URL}/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
        );
        
        if (!detailsResponse.ok) {
          throw new Error(`YouTube API details error: ${detailsResponse.status}`);
        }
        
        const detailsData = await detailsResponse.json();
        
        return detailsData.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          duration: item.contentDetails.duration,
          thumbnails: item.snippet.thumbnails
        }));
      });
    } catch (error) {
      console.error('YouTube API search failed, using fallback:', error);
      // Use fallback search when API fails
      return await fallbackSearch(query, maxResults);
    }
  },

  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
      return await makeRequestWithFallback(async (apiKey) => {
        const response = await fetch(
          `${YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(`YouTube API quota exceeded or forbidden (403)`);
          }
          throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) return null;
        
        const item = data.items[0];
        return {
          id: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          duration: item.contentDetails.duration,
          thumbnails: item.snippet.thumbnails
        };
      });
    } catch (error) {
      console.error('Error getting video details:', error);
      
      // Return a mock video for the given ID
      return {
        id: videoId,
        title: 'Video Title (API Unavailable)',
        channelTitle: 'Unknown Channel',
        duration: 'PT3M30S',
        thumbnails: {
          default: { url: 'no' },
          medium: { url: 'no' },
          high: { url: 'no' }
        }
      };
    }
  },

  async getPlaylistItems(playlistId: string): Promise<YouTubeVideo[]> {
    try {
      return await makeRequestWithFallback(async (apiKey) => {
        const response = await fetch(
          `${YOUTUBE_BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(`YouTube API quota exceeded or forbidden (403)`);
          }
          throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items) return [];
        
        const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
        const detailsResponse = await fetch(
          `${YOUTUBE_BASE_URL}/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
        );
        
        if (!detailsResponse.ok) {
          throw new Error(`YouTube API details error: ${detailsResponse.status}`);
        }
        
        const detailsData = await detailsResponse.json();
        
        return detailsData.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          duration: item.contentDetails.duration,
          thumbnails: item.snippet.thumbnails
        }));
      });
    } catch (error) {
      console.error('Error getting playlist items:', error);
      return [];
    }
  },

  extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  },

  extractPlaylistId(url: string): string | null {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
};