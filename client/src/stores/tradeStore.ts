/**
 * Trade Store
 * Manages trading journal entries using MobX
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { tradesAPI } from '../services/api';
import type { Trade, TradeInput } from '../types';
import { AxiosError } from 'axios';

class TradeStore {
  trades: Trade[] = [];
  editingTrade: Trade | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Helper: Handle trade operation error
   */
  private handleError(err: unknown, defaultMessage: string): void {
    if (err instanceof AxiosError) {
      this.error = err.response?.data?.error || defaultMessage;
    } else {
      this.error = 'An unexpected error occurred';
    }
  }

  /**
   * Fetch all trades for the current user
   */
  async fetchTrades(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await tradesAPI.getAll();
      runInAction(() => {
        this.trades = data;
      });
    } catch (err) {
      runInAction(() => {
        this.handleError(err, 'Failed to fetch trades');
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Create a new trade
   */
  async createTrade(trade: TradeInput): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.create(trade);
      await this.fetchTrades(); // Refresh trades list
      return true;
    } catch (err) {
      runInAction(() => {
        this.handleError(err, 'Failed to create trade');
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Update an existing trade
   */
  async updateTrade(id: string, trade: Partial<TradeInput>): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.update(id, trade);
      await this.fetchTrades(); // Refresh trades list
      runInAction(() => {
        this.editingTrade = null; // Clear editing state
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.handleError(err, 'Failed to update trade');
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Delete a trade
   */
  async deleteTrade(id: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.delete(id);
      await this.fetchTrades(); // Refresh trades list
      return true;
    } catch (err) {
      runInAction(() => {
        this.handleError(err, 'Failed to delete trade');
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Set the trade being edited
   */
  setEditingTrade(trade: Trade | null): void {
    this.editingTrade = trade;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }
}

// Export singleton instance
export const tradeStore = new TradeStore();
