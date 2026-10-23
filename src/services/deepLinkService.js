import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const ALLOWED_ROUTES = [
  /^\/$/, /^\/login$/, /^\/register$/, /^\/register\/invite\/[A-Za-z0-9_-]{20,128}$/,
  /^\/forgot-password$/, /^\/reset-password$/, /^\/privacy-policy$/,
  /^\/terms-of-service$/, /^\/settings$/, /^\/change-password$/,
];

const validatedPath = (urlObj) => {
  if (urlObj.protocol !== 'https:' || urlObj.hostname !== 'av.ramsabha.in') return null;
  if (!ALLOWED_ROUTES.some((pattern) => pattern.test(urlObj.pathname))) return null;
  const allowedQuery = new URLSearchParams();
  if (urlObj.pathname === '/reset-password' && urlObj.searchParams.has('token')) {
    const token = urlObj.searchParams.get('token');
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return null;
    allowedQuery.set('token', token);
  }
  const query = allowedQuery.toString();
  return urlObj.pathname + (query ? `?${query}` : '');
};

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
        const path = validatedPath(urlObj);
        if (!path) return;
        
        if (this.navigationHandler) {
          this.navigationHandler(path);
        } else {
          sessionStorage.setItem('pendingDeepLinkPath', path);
        }
      }

    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  // Get and clear any pending deep link path
  getPendingPath() {
    const path = sessionStorage.getItem('pendingDeepLinkPath');
    if (path) {
      sessionStorage.removeItem('pendingDeepLinkPath');
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
          return validatedPath(urlObj);
        }
      }
    } catch (error) {
      console.warn('Could not get launch URL:', error);
    }

    return null;
  }
}

export const deepLinkService = new DeepLinkService();
