import { GoogleAuth } from '@southdevs/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { GOOGLE_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../config/constants';

export class NativeGoogleAuthService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Only initialize on native platforms
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize({
          clientId: GOOGLE_CLIENT_ID, // Web Client ID for server-side verification
          androidClientId: GOOGLE_ANDROID_CLIENT_ID, // Android Client ID for native auth
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
          // Force account selection on every sign-in
          forceAccountSelection: true,
        });
        this.isInitialized = true;
        console.log('✅ Native Google Auth initialized with account selection forced');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  async signIn() {
    try {
      // Ensure initialization
      await this.initialize();

      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Native Google Auth only works on mobile devices');
      }

      console.log('🔑 Starting native Google Sign-In...');
      
      // Try to clear any cached credentials first to force account selection
      try {
        console.log('🧽 Clearing cached credentials to show account picker...');
        await GoogleAuth.signOut();
      } catch (signOutError) {
        console.log('ℹ️ No cached credentials to clear');
      }
      
      // Perform native Google Sign-In - should now show account picker
      const result = await GoogleAuth.signIn();
      
      console.log('✅ Google Sign-In successful:', {
        email: result.email,
        name: result.name
      });

      return {
        idToken: result.authentication.idToken,
        accessToken: result.authentication.accessToken,
        email: result.email,
        name: result.name,
        photoUrl: result.imageUrl,
        familyName: result.familyName,
        givenName: result.givenName,
      };
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('🔑 Signing out from Google Auth SDK...');
        await GoogleAuth.signOut();
        console.log('✅ Google Sign-Out successful - account cache cleared');
        
        // Reset initialization flag to ensure fresh setup on next sign-in
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('❌ Google Sign-Out failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('🔌 Disconnecting Google Auth completely...');
        
        // First sign out
        await this.signOut();
        
        // Try to disconnect if the method exists
        try {
          // Some versions of the plugin have a disconnect method
          if ('disconnect' in GoogleAuth) {
            await GoogleAuth.disconnect();
            console.log('✅ Google Auth disconnected completely');
          }
        } catch (disconnectError) {
          console.log('ℹ️ Disconnect method not available, using signOut only');
        }
      }
    } catch (error) {
      console.error('❌ Google disconnect failed:', error);
      throw error;
    }
  }

  async refresh() {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Native Google Auth only works on mobile devices');
      }

      const result = await GoogleAuth.refresh();
      
      return {
        idToken: result.authentication.idToken,
        accessToken: result.authentication.accessToken,
        email: result.email,
        name: result.name,
        photoUrl: result.imageUrl,
        familyName: result.familyName,
        givenName: result.givenName,
      };
    } catch (error) {
      console.error('❌ Google token refresh failed:', error);
      throw error;
    }
  }

  isNativePlatform() {
    return Capacitor.isNativePlatform();
  }
}

export const nativeGoogleAuth = new NativeGoogleAuthService();
