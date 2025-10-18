import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ramsabha.agamvani',
  appName: 'Agam Vani',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Allow loading from localhost during development
    hostname: 'agamvani.local'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#EA580C",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
