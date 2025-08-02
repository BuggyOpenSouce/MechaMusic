// Spotify OAuth service for handling authentication
const SPOTIFY_CLIENT_ID = '86112ea5478e45fc9ca5030ce908fcdd';
const SPOTIFY_CLIENT_SECRET = '51a33b7200ce4768965081cf4e0e0bbf';
const SPOTIFY_REDIRECT_URI = `${window.location.origin}/`;
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');

// Generate a random string for state parameter
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: any | null;
}

class SpotifyAuthService {
  private state: SpotifyAuthState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null
  };

  private listeners: ((state: SpotifyAuthState) => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.handleCallback();
    this.checkTokenExpiry();
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: SpotifyAuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    console.log('SpotifyAuth - Notifying listeners with state:', this.state);
    this.listeners.forEach(listener => listener(this.state));
  }

  private saveToStorage() {
    try {
      localStorage.setItem('spotify-auth', JSON.stringify({
        accessToken: this.state.accessToken,
        refreshToken: this.state.refreshToken,
        expiresAt: this.state.expiresAt,
        user: this.state.user
      }));
      console.log('Spotify auth saved to storage');
    } catch (error) {
      console.error('Error saving Spotify auth to storage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('spotify-auth');
      if (stored) {
        const data = JSON.parse(stored);
        this.state = {
          ...this.state,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          user: data.user,
          isAuthenticated: !!data.accessToken && Date.now() < (data.expiresAt || 0)
        };
        console.log('Loaded Spotify auth from storage:', this.state);
      }
    } catch (error) {
      console.error('Error loading Spotify auth from storage:', error);
    }
  }

  private checkTokenExpiry() {
    if (this.state.accessToken && this.state.expiresAt) {
      const timeUntilExpiry = this.state.expiresAt - Date.now();
      
      if (timeUntilExpiry <= 0) {
        // Token expired
        console.log('Token expired, attempting refresh...');
        if (this.state.refreshToken) {
          this.refreshAccessToken();
        } else {
          this.logout();
        }
      } else if (timeUntilExpiry < 5 * 60 * 1000) {
        // Token expires in less than 5 minutes, refresh it
        console.log('Token expires soon, refreshing...');
        if (this.state.refreshToken) {
          this.refreshAccessToken();
        }
      } else {
        // Set timeout to refresh token before it expires
        setTimeout(() => this.checkTokenExpiry(), Math.min(timeUntilExpiry - 5 * 60 * 1000, 2147483647));
      }
    }
  }

  // Handle callback from Spotify
  private handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      alert(`Spotify authentication error: ${error}`);
      return;
    }

    if (code && state) {
      const storedState = sessionStorage.getItem('spotify-state');
      if (state !== storedState) {
        console.error('State mismatch in Spotify callback');
        alert('Security error: State mismatch in Spotify callback');
        return;
      }

      console.log('Processing Spotify callback with code:', code);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Exchange code for tokens
      this.exchangeCodeForTokens(code);
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForTokens(code: string) {
    try {
      console.log('Exchanging code for tokens...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json();
      console.log('Token exchange successful:', tokenData);
      
      // Get user info
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      let userData = null;
      if (userResponse.ok) {
        userData = await userResponse.json();
        console.log('User data retrieved:', userData);
      } else {
        console.warn('Failed to get user data:', userResponse.status);
      }
      
      // Update state
      this.state = {
        isAuthenticated: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        user: userData
      };

      // Clean up session storage
      sessionStorage.removeItem('spotify-state');

      // Save to storage
      this.saveToStorage();
      this.notifyListeners();
      this.checkTokenExpiry();

      console.log('Spotify authentication completed successfully');
      alert('Successfully logged in to Spotify!');
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      alert(`Failed to complete Spotify login: ${error.message}`);
    }
  }

  // Start the OAuth flow
  async login(): Promise<void> {
    try {
      const state = generateRandomString(16);
      
      // Store state for validation
      sessionStorage.setItem('spotify-state', state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SPOTIFY_SCOPES,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state: state,
        show_dialog: 'true'
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      console.log('Redirecting to Spotify auth:', authUrl);
      
      // Use window.location.href for better compatibility
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error starting Spotify login:', error);
      alert(`Failed to start Spotify login: ${error.message}`);
    }
  }

  // Refresh the access token
  private async refreshAccessToken(): Promise<void> {
    if (!this.state.refreshToken) {
      console.log('No refresh token available, logging out');
      this.logout();
      return;
    }

    try {
      console.log('Refreshing access token...');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.state.refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData);
        this.logout();
        return;
      }

      const data = await response.json();
      console.log('Token refresh successful:', data);
      
      this.state = {
        ...this.state,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.state.refreshToken,
        expiresAt: Date.now() + (data.expires_in * 1000),
        isAuthenticated: true
      };

      this.saveToStorage();
      this.notifyListeners();
      this.checkTokenExpiry();
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      this.logout();
    }
  }

  // Logout
  logout(): void {
    console.log('Logging out from Spotify');
    this.state = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null
    };

    localStorage.removeItem('spotify-auth');
    sessionStorage.removeItem('spotify-state');
    
    this.notifyListeners();
  }

  // Get current state
  getState(): SpotifyAuthState {
    return { ...this.state };
  }

  // Get access token (with automatic refresh if needed)
  async getAccessToken(): Promise<string | null> {
    return this.state.accessToken;
  }

  // Check if user is authenticated and token is valid
  isValidAuthentication(): boolean {
    const isValid = this.state.isAuthenticated && 
           !!this.state.accessToken && 
           !!this.state.expiresAt && 
           Date.now() < this.state.expiresAt - 2 * 60 * 1000;
    
    console.log('Authentication validity check:', {
      isAuthenticated: this.state.isAuthenticated,
      hasAccessToken: !!this.state.accessToken,
      hasExpiresAt: !!this.state.expiresAt,
      notExpired: this.state.expiresAt ? Date.now() < this.state.expiresAt - 2 * 60 * 1000 : false,
      result: isValid
    });
    
    return isValid;
  }

  // Check if user is logged in (simpler check)
  isLoggedIn(): boolean {
    return this.state.isAuthenticated && !!this.state.accessToken;
  }

  // Debug method to log current state
  debugState(): void {
    console.log('=== Spotify Auth Debug Info ===');
    console.log('Current State:', this.state);
    console.log('Is Authenticated:', this.state.isAuthenticated);
    console.log('Has Access Token:', !!this.state.accessToken);
    console.log('Has Refresh Token:', !!this.state.refreshToken);
    console.log('Token Expires At:', this.state.expiresAt ? new Date(this.state.expiresAt).toLocaleString() : 'N/A');
    console.log('Time Until Expiry:', this.state.expiresAt ? Math.round((this.state.expiresAt - Date.now()) / 1000 / 60) + ' minutes' : 'N/A');
    console.log('User Info:', this.state.user);
    console.log('Is Valid Authentication:', this.isValidAuthentication());
    console.log('Is Logged In:', this.isLoggedIn());
    console.log('===============================');
  }
}

export const spotifyAuth = new SpotifyAuthService();