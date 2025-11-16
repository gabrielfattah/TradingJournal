/**
 * Authentication Store
 * Manages user authentication state using MobX
 */

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

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Helper: Handle authentication error
   */
  private handleAuthError(err: unknown, defaultMessage: string): void {
    if (err instanceof AxiosError) {
      this.error = err.response?.data?.error || defaultMessage;
    } else {
      this.error = 'An unexpected error occurred';
    }
  }

  /**
   * Helper: Save authentication data to state and localStorage
   */
  private saveAuthData(token: string, username: string): void {
    this.token = token;
    this.username = username;
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    this.error = null; // Clear any previous errors
  }

  /**
   * Register a new user
   */
  async register(username: string, password: string): Promise<boolean> {
    this.isLoading = true;

    try {
      const response = await authAPI.register(username, password);
      this.saveAuthData(response.token, response.username);
      return true;
    } catch (err) {
      this.handleAuthError(err, 'Registration failed');
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<boolean> {
    this.isLoading = true;

    try {
      const response = await authAPI.login(username, password);
      this.saveAuthData(response.token, response.username);
      return true;
    } catch (err) {
      this.handleAuthError(err, 'Login failed');
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Login with Google credential (popup mode)
   */
  async loginWithGoogle(credential: string): Promise<boolean> {
    this.isLoading = true;

    try {
      const response = await authAPI.googleLogin(credential);
      this.saveAuthData(response.token, response.username);
      return true;
    } catch (err) {
      this.handleAuthError(err, 'Google login failed');
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Login with Google authorization code (redirect mode)
   */
  async loginWithGoogleCode(code: string): Promise<boolean> {
    this.isLoading = true;

    try {
      const response = await authAPI.googleCodeLogin(code);
      this.saveAuthData(response.token, response.username);
      return true;
    } catch (err) {
      this.handleAuthError(err, 'Google login failed');
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.token = null;
    this.username = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }
}

// Export singleton instance
export const authStore = new AuthStore();
