import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    // But for mobile native auth, we also check localStorage for tokens
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Suppress 401 errors for /auth/me endpoint (expected when not logged in)
      if (!error.config?.url?.includes('/auth/me')) {
        console.error('Unauthorized access');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authAPI = {
  // Legacy registration (direct)
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // OTP-based registration
  requestOTP: async (data) => {
    const payload = {
      email: data.email,
      password: data.password,
      full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    };
    // Include invitation token if provided
    if (data.token) {
      payload.token = data.token;
    }
    const response = await apiClient.post('/auth/request-otp', payload);
    return response.data;
  },

  verifyOTP: async (data) => {
    const payload = {
      email: data.email,
      otp_code: data.otp_code,
    };
    // Include invitation token if provided
    if (data.token) {
      payload.token = data.token;
    }
    const response = await apiClient.post('/auth/verify-otp', payload);
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await apiClient.post('/auth/login', {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  // Google OAuth
  googleLogin: (invitationToken = null) => {
    let url = `${API_BASE_URL}/auth/google`;
    if (invitationToken) {
      url += `?invitation_token=${encodeURIComponent(invitationToken)}`;
    }
    window.location.href = url;
  },

  googleNativeLogin: async (idToken) => {
    const response = await apiClient.post('/auth/google/native', {
      id_token: idToken,
    });
    return response.data;
  },

  // Password management
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', {
      token: data.token,
      new_password: data.new_password,
    });
    return response.data;
  },

  changePassword: async (data) => {
    const response = await apiClient.post('/auth/change-password', {
      current_password: data.current_password,
      new_password: data.new_password,
    });
    return response.data;
  },

  // Token management
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // Session management
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // User profile
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Account deletion
  deleteAccount: async () => {
    const response = await apiClient.delete('/auth/me');
    return response.data;
  },

  // Profile completion
  completeProfile: async (profileData) => {
    const response = await apiClient.post('/auth/profile/complete', profileData);
    return response.data;
  },
};

/**
 * User Profile API
 */
export const userAPI = {
  updateProfile: async (data) => {
    const response = await apiClient.put('/api/users/profile', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  },
};

/**
 * Radio API
 */
export const radioAPI = {
  getLiveStream: async () => {
    const response = await apiClient.get('/api/radio/live');
    return response.data;
  },

  getStreams: async () => {
    const response = await apiClient.get('/api/radio/streams');
    return response.data;
  },

  getPlaylist: async () => {
    const response = await apiClient.get('/api/radio/playlist');
    return response.data;
  },

  getNowPlaying: async () => {
    const response = await apiClient.get('/api/radio/now-playing');
    return response.data;
  },

  uploadAudio: async (formData, adminKey) => {
    const response = await apiClient.post('/api/radio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Admin-Key': adminKey,
      },
    });
    return response.data;
  },
};

/**
 * Admin API
 */
export const adminAPI = {
  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  updateUser: async (userId, updates) => {
    const response = await apiClient.put(`/admin/users/${userId}`, updates);
    return response.data;
  },

  approveUser: async (userId) => {
    const response = await apiClient.post(`/admin/users/${userId}/approve`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Invitations
  generateInvitation: async (data) => {
    const response = await apiClient.post('/admin/invitations/generate', data);
    return response.data;
  },

  getInvitations: async () => {
    const response = await apiClient.get('/admin/invitations');
    return response.data;
  },

  revokeInvitation: async (invitationId) => {
    const response = await apiClient.delete(`/admin/invitations/${invitationId}`);
    return response.data;
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};

export default {
  authAPI,
  userAPI,
  radioAPI,
  adminAPI,
  healthAPI,
};
