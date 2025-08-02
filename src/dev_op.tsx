// Developer Operations Configuration
// Edit this file to enable/disable developer tools and indicators

export const DevConfig = {
  // Debug and Developer Tools
  showSpotifyDebugButton: false,
  showSpotifyRefreshButton: false,
  showLoadingIndicators: false,
  showErrorBoundaries: true,
  
  // Console Logging
  enableConsoleLogging: true,
  enableAPILogging: false,
  enableStateLogging: false,
  
  // Performance Indicators
  showPerformanceMetrics: true,
  showRenderCounts: false,
  
  // Development Features
  enableHotReload: true,
  showComponentBorders: false,
  
  // Testing Features
  enableTestMode: false,
  showTestData: false,
  
  // API Configuration
  enableAPIFallbacks: false,
  showAPIStatus: false,
  
  // Spotify Player Info
  showSpotifyPlayerInfo: false,
  
  // UI Debug Features
  showLayoutGrid: false,
  highlightInteractiveElements: false,
  
  // Accessibility Tools
  showA11yIndicators: false,
  enableA11yTesting: false
};

// Helper function to check if any dev feature is enabled
export const isDevModeEnabled = () => {
  return Object.values(DevConfig).some(value => value === true);
};

// Helper function to conditionally render dev components
export const renderIfDevEnabled = (key: keyof typeof DevConfig, component: React.ReactNode) => {
  return DevConfig[key] ? component : null;
};