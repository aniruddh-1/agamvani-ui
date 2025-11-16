import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ramsabha.agamvani',
  appName: 'Agam Vani',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#EA580C",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '420256009464-7vmql14haba955lrp63klmqoidgkkckk.apps.googleusercontent.com',
      androidClientId: '420256009464-pt7hding1jt80js6hseqmhfnekpok4di.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    App: {
      // Keep app alive in background for audio playback
      handleBackButton: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
