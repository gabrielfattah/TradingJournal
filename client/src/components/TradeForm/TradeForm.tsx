/**
 * Trade Form Component
 * Handles creation and editing of trade entries
 * Automatically populates fields when editing a trade from the store
 */

import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { tradeStore } from '../../stores';
import type { TradeInput } from '../../types';
import styles from './TradeForm.module.css';

// Constants
const DEFAULT_TRADE_TYPE = 'long';
const PRICE_STEP = '0.01';
const SIZE_STEP = '0.0001';
const NOTES_ROWS = 3;

const TradeForm = observer(() => {
  // Form state
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'long' | 'short'>(DEFAULT_TRADE_TYPE);
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [size, setSize] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  /**
   * Helper: Reset form to initial empty state
   */
  const resetForm = () => {
    setSymbol('');
    setType(DEFAULT_TRADE_TYPE);
    setEntryPrice('');
    setExitPrice('');
    setSize('');
    setDate('');
    setNotes('');
  };

  /**
   * Helper: Build trade object from form inputs
   */
  const buildTradeInput = (): TradeInput => ({
    symbol: symbol.toUpperCase(),
    type,
    entryPrice: parseFloat(entryPrice),
    exitPrice: parseFloat(exitPrice),
    size: parseFloat(size),
    date,
    notes: notes.trim(),
  });

  /**
   * Effect: Watch for changes to editingTrade and populate form
   * Uses MobX reaction to efficiently track changes
   */
  useEffect(() => {
    const dispose = reaction(
      () => tradeStore.editingTrade,
      (editingTrade) => {
        if (editingTrade) {
          // Populate form with trade data for editing
          setSymbol(editingTrade.symbol);
          setType(editingTrade.type);
          setEntryPrice(editingTrade.entryPrice.toString());
          setExitPrice(editingTrade.exitPrice.toString());
          setSize(editingTrade.size.toString());
          setDate(editingTrade.date);
          setNotes(editingTrade.notes || '');
        } else {
          // Clear form when not editing
          resetForm();
        }
      },
      { fireImmediately: true }
    );

    // Cleanup reaction on unmount
    return dispose;
  }, []);

  /**
   * Handle form submission (create or update trade)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trade = buildTradeInput();

    if (tradeStore.editingTrade) {
      // Update existing trade
      await tradeStore.updateTrade(tradeStore.editingTrade.id, trade);
    } else {
      // Create new trade
      await tradeStore.createTrade(trade);
    }

    // Reset form after successful creation (updates are handled by store)
    if (!tradeStore.editingTrade) {
      resetForm();
    }
  };

  /**
   * Handle cancel button (exit edit mode)
   */
  const handleCancel = () => {
    tradeStore.setEditingTrade(null);
    resetForm();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {tradeStore.editingTrade ? 'Edit Trade' : 'Add New Trade'}
      </h3>

      {/* Error Message Display */}
      {tradeStore.error && (
        <div className={styles.error}>
          {tradeStore.error}
          <button type="button" onClick={() => tradeStore.clearError()}>
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Trade Details Grid */}
        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Symbol:</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTC, ETH, etc."
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Type:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'long' | 'short')}
              className={styles.select}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Entry Price:</label>
            <input
              type="number"
              step={PRICE_STEP}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="50000"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Exit Price:</label>
            <input
              type="number"
              step={PRICE_STEP}
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="52000"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Size:</label>
            <input
              type="number"
              step={SIZE_STEP}
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.1"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>

        {/* Notes Field (full width) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Trade notes..."
            rows={NOTES_ROWS}
            className={styles.textarea}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            {tradeStore.editingTrade ? 'Update Trade' : 'Create Trade'}
          </button>

          {tradeStore.editingTrade && (
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

export default TradeForm;
