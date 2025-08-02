const SPOTIFY_CLIENT_ID = '86112ea5478e45fc9ca5030ce908fcdd';
const SPOTIFY_CLIENT_SECRET = '51a33b7200ce4768965081cf4e0e0bbf';
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  external_urls: { spotify: string };
  album: {
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: {
    items: Array<{ track: SpotifyTrack }>;
  };
}

class SpotifyAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const data = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
      );
      return data.tracks.items;
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      return [];
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      return await this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Error getting Spotify track:', error);
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    try {
      return await this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`);
    } catch (error) {
      console.error('Error getting Spotify playlist:', error);
      return null;
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      const data = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(
        `/playlists/${playlistId}/tracks`
      );
      return data.items.map(item => item.track).filter(track => track && track.id);
    } catch (error) {
      console.error('Error getting Spotify playlist tracks:', error);
      return [];
    }
  }

  extractTrackId(url: string): string | null {
    const regex = /(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  extractPlaylistId(url: string): string | null {
    const regex = /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async searchForSpotifyTrack(title: string, artist: string): Promise<SpotifyTrack | null> {
    try {
      const query = `track:"${title}" artist:"${artist}"`;
      const tracks = await this.searchTracks(query, 1);
      return tracks.length > 0 ? tracks[0] : null;
    } catch (error) {
      console.error('Error searching for Spotify track:', error);
      return null;
    }
  }

  async getMyDevices(): Promise<any[]> {
    try {
      const data = await this.makeRequest<{ devices: any[] }>('/me/player/devices');
      return data.devices;
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  async transferPlayback(deviceId: string): Promise<void> {
    try {
      await this.makeRequest('/me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });
    } catch (error) {
      console.error('Error transferring playback:', error);
    }
  }

  // User-specific methods that require user access token
  async createPlaylistForUser(accessToken: string, userId: string, name: string, description: string = '', isPublic: boolean = false): Promise<any> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description,
          public: isPublic
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      throw error;
    }
  }

  async addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]): Promise<void> {
    try {
      // Spotify API allows max 100 tracks per request
      const batchSize = 100;
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: batch
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to add tracks to playlist: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error adding tracks to Spotify playlist:', error);
      throw error;
    }
  }

  async getCurrentUser(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get current user: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current Spotify user:', error);
      throw error;
    }
  }

  async exportPlaylistToSpotify(accessToken: string, playlistName: string, playlistDescription: string, songs: any[]): Promise<{ success: boolean; playlistUrl?: string; playlistId?: string; foundTracks?: number; totalTracks?: number; notFoundSongs?: string[]; error?: string }> {
    try {
      // Get current user info
      const user = await this.getCurrentUser(accessToken);
      if (!user || !user.id) {
        throw new Error('Unable to get user information. Please ensure you are logged in to Spotify.');
      }
      
      // Step 1: Create the playlist
      const playlist = await this.createPlaylistForUser(
        accessToken,
        user.id,
        playlistName,
        playlistDescription || `Exported from MechaMusic - ${new Date().toLocaleDateString()}`,
        false // private playlist
      );
      
      // Step 2: Search for each song and collect Spotify URIs
      const trackUris: string[] = [];
      const notFoundSongs: string[] = [];
      let foundTracks = 0;
      
      for (const song of songs) {
        try {
          // If it's already a Spotify song, use its ID directly
          if (song.source === 'spotify' && song.spotifyId) {
            trackUris.push(`spotify:track:${song.spotifyId}`);
            foundTracks++;
            continue;
          }
          
          // Search for the song on Spotify
          // Try multiple search strategies for better results
          let track = null;
          
          // Strategy 1: Exact search with quotes
          let searchResults = await this.searchTracks(`track:"${song.title}" artist:"${song.artist}"`, 1);
          
          if (searchResults.length > 0) {
            track = searchResults[0];
          } else {
            // Strategy 2: Search without quotes
            searchResults = await this.searchTracks(`${song.title} ${song.artist}`, 5);
            
            if (searchResults.length > 0) {
              // Find the best match by comparing titles and artists
              track = this.findBestMatch(song, searchResults);
            }
          }
          
          if (!track) {
            // Strategy 3: Search by title only
            searchResults = await this.searchTracks(song.title, 10);
            
            if (searchResults.length > 0) {
              track = this.findBestMatch(song, searchResults);
            }
          }
          
          if (track) {
            trackUris.push(`spotify:track:${track.id}`);
            foundTracks++;
          } else {
            notFoundSongs.push(`${song.title} - ${song.artist}`);
          }
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          notFoundSongs.push(`${song.title} - ${song.artist}`);
        }
      }
      
      // Step 3: Add found tracks to the playlist
      if (trackUris.length > 0) {
        await this.addTracksToPlaylist(accessToken, playlist.id, trackUris);
      }

      const result = {
        success: true,
        playlistUrl: playlist.external_urls.spotify,
        playlistId: playlist.id,
        foundTracks: foundTracks,
        totalTracks: songs.length,
        notFoundSongs: notFoundSongs
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Spotify playlist.'
      };
    }
  }

  // Helper method to find the best match from search results
  private findBestMatch(originalSong: any, searchResults: SpotifyTrack[]): SpotifyTrack | null {
    if (searchResults.length === 0) return null;
    
    const originalTitle = originalSong.title.toLowerCase().trim();
    const originalArtist = originalSong.artist.toLowerCase().trim();
    
    // Score each result
    let bestMatch = searchResults[0];
    let bestScore = 0;
    
    for (const track of searchResults) {
      const trackTitle = track.name.toLowerCase().trim();
      const trackArtist = track.artists[0]?.name.toLowerCase().trim() || '';
      
      let score = 0;
      
      // Title similarity (most important)
      if (trackTitle === originalTitle) {
        score += 100;
      } else if (trackTitle.includes(originalTitle) || originalTitle.includes(trackTitle)) {
        score += 50;
      } else if (this.calculateSimilarity(trackTitle, originalTitle) > 0.7) {
        score += 30;
      }
      
      // Artist similarity
      if (trackArtist === originalArtist) {
        score += 50;
      } else if (trackArtist.includes(originalArtist) || originalArtist.includes(trackArtist)) {
        score += 25;
      } else if (this.calculateSimilarity(trackArtist, originalArtist) > 0.7) {
        score += 15;
      }
      
      // Prefer explicit versions over clean versions
      if (!track.explicit && originalTitle.includes('explicit')) {
        score -= 10;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = track;
      }
    }
    
    // Only return if we have a reasonable match
    return bestScore > 30 ? bestMatch : searchResults[0];
  }
  
  // Helper method to calculate string similarity
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  // Helper method to calculate Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const spotifyApi = new SpotifyAPI();