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

  async fetchTrades() {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await tradesAPI.getAll();
      runInAction(() => {
        this.trades = data;
      });
    } catch (err) {
      runInAction(() => {
        if (err instanceof AxiosError) {
          this.error = err.response?.data?.error || 'Failed to fetch trades';
        } else {
          this.error = 'An unexpected error occurred';
        }
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async createTrade(trade: TradeInput) {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.create(trade);
      await this.fetchTrades();
      return true;
    } catch (err) {
      runInAction(() => {
        if (err instanceof AxiosError) {
          this.error = err.response?.data?.error || 'Failed to create trade';
        } else {
          this.error = 'An unexpected error occurred';
        }
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async updateTrade(id: string, trade: Partial<TradeInput>) {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.update(id, trade);
      await this.fetchTrades();
      runInAction(() => {
        this.editingTrade = null;
      });
      return true;
    } catch (err) {
      runInAction(() => {
        if (err instanceof AxiosError) {
          this.error = err.response?.data?.error || 'Failed to update trade';
        } else {
          this.error = 'An unexpected error occurred';
        }
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async deleteTrade(id: string) {
    this.isLoading = true;
    this.error = null;

    try {
      await tradesAPI.delete(id);
      await this.fetchTrades();
      return true;
    } catch (err) {
      runInAction(() => {
        if (err instanceof AxiosError) {
          this.error = err.response?.data?.error || 'Failed to delete trade';
        } else {
          this.error = 'An unexpected error occurred';
        }
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  setEditingTrade(trade: Trade | null) {
    this.editingTrade = trade;
  }

  clearError() {
    this.error = null;
  }
}

export const tradeStore = new TradeStore();