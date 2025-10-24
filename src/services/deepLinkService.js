import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

class DeepLinkService {
  navigationHandler = null;
  launchUrlProcessed = false;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      // Listen for app URL opens (deep links)
      App.addListener('appUrlOpen', (data) => {
        this.handleDeepLink(data.url);
      });
    }
  }

  setNavigationHandler(handler) {
    this.navigationHandler = handler;
  }

  handleDeepLink(url) {
    try {
      const urlObj = new URL(url);
      
      // Don't interfere with OAuth callbacks
      const isOAuthCallback = (
        (urlObj.protocol === 'agamvani:' && urlObj.hostname === 'oauth') ||
        (urlObj.host === 'av.ramsabha.in' && urlObj.pathname.startsWith('/auth/google/callback'))
      );

      if (isOAuthCallback) {
        return; // Let OAuth service handle this
      }

      // Handle general app deep links for av.ramsabha.in
      if (urlObj.host === 'av.ramsabha.in') {
        const path = urlObj.pathname + urlObj.search;
        
        if (this.navigationHandler) {
          this.navigationHandler(path);
        } else {
          localStorage.setItem('pendingDeepLinkPath', path);
        }
      }

    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  // Get and clear any pending deep link path
  getPendingPath() {
    const path = localStorage.getItem('pendingDeepLinkPath');
    if (path) {
      localStorage.removeItem('pendingDeepLinkPath');
      return path;
    }
    return null;
  }

  // Handle initial app launch with deep link
  async handleInitialLaunch() {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    // Prevent repeated calls
    if (this.launchUrlProcessed) {
      return null;
    }

    this.launchUrlProcessed = true;

    try {
      const result = await App.getLaunchUrl();
      if (result && result.url) {
        const urlObj = new URL(result.url);
        
        // Only handle general deep links, not OAuth
        if (urlObj.host === 'av.ramsabha.in' && !urlObj.pathname.startsWith('/auth/google/callback')) {
          const path = urlObj.pathname + urlObj.search;
          return path;
        }
      }
    } catch (error) {
      console.warn('Could not get launch URL:', error);
    }

    return null;
  }
}

export const deepLinkService = new DeepLinkService();
