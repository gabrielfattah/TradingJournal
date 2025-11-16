import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { tradeStore } from '../../stores';
import type { TradeInput } from '../../types';
import styles from './TradeForm.module.css';

const TradeForm = observer(() => {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'long' | 'short'>('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [size, setSize] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Pre-fill form if editing - using MobX reaction to track editingTrade changes
  useEffect(() => {
    const dispose = reaction(
      () => tradeStore.editingTrade,
      (editingTrade) => {
        if (editingTrade) {
          setSymbol(editingTrade.symbol);
          setType(editingTrade.type);
          setEntryPrice(editingTrade.entryPrice.toString());
          setExitPrice(editingTrade.exitPrice.toString());
          setSize(editingTrade.size.toString());
          setDate(editingTrade.date);
          setNotes(editingTrade.notes || '');
        } else {
          resetForm();
        }
      },
      { fireImmediately: true }
    );

    return dispose;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trade: TradeInput = {
      symbol: symbol.toUpperCase(),
      type,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      size: parseFloat(size),
      date,
      notes: notes.trim(),
    };

    if (tradeStore.editingTrade) {
      await tradeStore.updateTrade(tradeStore.editingTrade.id, trade);
    } else {
      await tradeStore.createTrade(trade);
    }

    // Reset form if not editing
    if (!tradeStore.editingTrade) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSymbol('');
    setType('long');
    setEntryPrice('');
    setExitPrice('');
    setSize('');
    setDate('');
    setNotes('');
  };

  const handleCancel = () => {
    tradeStore.setEditingTrade(null);
    resetForm();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {tradeStore.editingTrade ? 'Edit Trade' : 'Add New Trade'}
      </h3>

      {tradeStore.error && (
        <div className={styles.error}>
          {tradeStore.error}
          <button type="button" onClick={() => tradeStore.clearError()}>
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
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
              step="0.01"
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
              step="0.01"
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
              step="0.0001"
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

        <div className={styles.formGroup}>
          <label className={styles.label}>Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Trade notes..."
            rows={3}
            className={styles.textarea}
          />
        </div>

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