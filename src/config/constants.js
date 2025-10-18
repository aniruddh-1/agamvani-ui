// Environment-based configuration constants
// All configuration is loaded from environment variables with sensible defaults

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';
export const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || 'http://localhost:8002';
export const STREAM_BASE_URL = import.meta.env.VITE_STREAM_URL || 'http://localhost:8002/radio/hls';

// Frontend Configuration
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';
export const FRONTEND_PORT = import.meta.env.VITE_PORT || 3001;

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${FRONTEND_URL}/auth/google/callback`;

// Environment
export const NODE_ENV = import.meta.env.MODE || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// API Endpoints (constructed from base URL)
export const API_ENDPOINTS = {
  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
  
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_REFRESH: `${API_BASE_URL}/auth/refresh`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  
  // Google OAuth
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google/login`,
  GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback`,
  
  // Radio
  RADIO_LIVE: `${API_BASE_URL}/api/radio/live`,
  RADIO_STREAMS: `${API_BASE_URL}/api/radio/streams`,
  RADIO_PLAYLIST: `${API_BASE_URL}/api/radio/playlist`,
  RADIO_STREAM: (filename) => `${API_BASE_URL}/api/radio/stream/${filename}`,
  RADIO_UPLOAD: `${API_BASE_URL}/api/radio/upload`,
  RADIO_HLS: (filename) => `${STREAM_BASE_URL}/${filename}`,
  RADIO_THUMBNAIL: (filename) => `${API_BASE_URL}/radio/thumbnails/${filename}`,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Agamvani Radio',
  DESCRIPTION: 'Spiritual Content Radio Streaming Platform',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'hi'],
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'm4a', 'aac'],
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
};

// HTTP Configuration
export const HTTP_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Log configuration to console in development
// Disabled for cleaner console output
// if (IS_DEVELOPMENT) {
//   console.log('📋 App Configuration:', {
//     API_BASE_URL,
//     FRONTEND_URL,
//     NODE_ENV,
//     GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? '✓ Configured' : '✗ Missing',
//   });
// }

export default {
  API_BASE_URL,
  API_ROOT_URL,
  STREAM_BASE_URL,
  FRONTEND_URL,
  FRONTEND_PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  API_ENDPOINTS,
  STORAGE_KEYS,
  APP_CONFIG,
  HTTP_CONFIG,
  VALIDATION,
};
