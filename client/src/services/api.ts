import axios from 'axios';
import type { AuthResponse, Trade, TradeInput, TradeStats } from '../types';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      username,
      password,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};

// Trades API
export const tradesAPI = {
  getAll: async (): Promise<Trade[]> => {
    const response = await api.get<Trade[]>('/api/trades');
    return response.data;
  },

  create: async (trade: TradeInput): Promise<Trade> => {
    const response = await api.post<Trade>('/api/trades', trade);
    return response.data;
  },

  update: async (id: string, trade: Partial<TradeInput>): Promise<Trade> => {
    const response = await api.put<Trade>(`/api/trades/${id}`, trade);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/trades/${id}`);
  },

  getStats: async (): Promise<TradeStats> => {
    const response = await api.get<TradeStats>('/api/trades/stats');
    return response.data;
  },
};

export default api;