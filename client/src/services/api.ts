/**
 * API Client Configuration
 * Configures Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';
import type { AuthResponse, Trade, TradeInput, TradeStats } from '../types';

// Constants
const API_URL = 'http://localhost:5000';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const TOKEN_KEY = 'token';
const USERNAME_KEY = 'username';

/**
 * Axios instance configured with base URL and default settings
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

/**
 * Request Interceptor
 * Automatically attaches JWT token to all outgoing requests
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor
 * Handles authentication errors (401) by clearing session and redirecting to login
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (expired or invalid token)
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API Endpoints
 * Handles user registration, login, and OAuth authentication
 */
export const authAPI = {
  /**
   * Register a new user with username and password
   */
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      username,
      password,
    });
    return response.data;
  },

  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  /**
   * Login with Google credential (popup mode)
   * @param credential - JWT credential from Google Sign-In
   */
  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/google', {
      credential,
    });
    return response.data;
  },

  /**
   * Login with Google authorization code (redirect mode)
   * @param code - Authorization code from Google OAuth redirect
   */
  googleCodeLogin: async (code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/google/callback', {
      code,
    });
    return response.data;
  },
};

/**
 * Trades API Endpoints
 * Handles CRUD operations for trading journal entries
 */
export const tradesAPI = {
  /**
   * Fetch all trades for the authenticated user
   */
  getAll: async (): Promise<Trade[]> => {
    const response = await api.get<Trade[]>('/api/trades');
    return response.data;
  },

  /**
   * Create a new trade entry
   */
  create: async (trade: TradeInput): Promise<Trade> => {
    const response = await api.post<Trade>('/api/trades', trade);
    return response.data;
  },

  /**
   * Update an existing trade entry
   */
  update: async (id: string, trade: Partial<TradeInput>): Promise<Trade> => {
    const response = await api.put<Trade>(`/api/trades/${id}`, trade);
    return response.data;
  },

  /**
   * Delete a trade entry
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/trades/${id}`);
  },

  /**
   * Get trading statistics for the authenticated user
   */
  getStats: async (): Promise<TradeStats> => {
    const response = await api.get<TradeStats>('/api/trades/stats');
    return response.data;
  },
};

export default api;
