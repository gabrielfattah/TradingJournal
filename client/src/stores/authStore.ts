import { makeAutoObservable } from 'mobx';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

class AuthStore {
  token: string | null = localStorage.getItem('token');
  username: string | null = localStorage.getItem('username');
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  async login(username: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authAPI.login(username, password);
      this.token = response.token;
      this.username = response.username;
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      
      return true;
    } catch (err) {
      // Type-safe error handling
      if (err instanceof AxiosError) {
        this.error = err.response?.data?.error || 'Login failed';
      } else {
        this.error = 'An unexpected error occurred';
      }
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async register(username: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authAPI.register(username, password);
      this.token = response.token;
      this.username = response.username;

      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);

      return true;
    } catch (err) {
      // Type-safe error handling
      if (err instanceof AxiosError) {
        this.error = err.response?.data?.error || 'Registration failed';
      } else {
        this.error = 'An unexpected error occurred';
      }
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(credential: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authAPI.googleLogin(credential);
      this.token = response.token;
      this.username = response.username;

      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);

      return true;
    } catch (err) {
      // Type-safe error handling
      if (err instanceof AxiosError) {
        this.error = err.response?.data?.error || 'Google login failed';
      } else {
        this.error = 'An unexpected error occurred';
      }
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogleCode(code: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authAPI.googleCodeLogin(code);
      this.token = response.token;
      this.username = response.username;

      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);

      return true;
    } catch (err) {
      // Type-safe error handling
      if (err instanceof AxiosError) {
        this.error = err.response?.data?.error || 'Google login failed';
      } else {
        this.error = 'An unexpected error occurred';
      }
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  logout() {
    this.token = null;
    this.username = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  clearError() {
    this.error = null;
  }
}

export const authStore = new AuthStore();