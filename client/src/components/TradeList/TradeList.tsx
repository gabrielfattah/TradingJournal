/**
 * Trade List Component
 * Displays all trades in a table format with edit and delete actions
 * Shows profit/loss with color coding (green for profit, red for loss)
 */

import { observer } from 'mobx-react-lite';
import { tradeStore } from '../../stores';
import type { Trade } from '../../types';
import styles from './TradeList.module.css';

// Constants
const DELETE_CONFIRMATION_MESSAGE = 'Are you sure you want to delete this trade?';
const DECIMAL_PLACES = 2;
const EMPTY_NOTES_PLACEHOLDER = '-';

const TradeList = observer(() => {
  /**
   * Helper: Format currency value with dollar sign and thousands separator
   */
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  /**
   * Helper: Format profit/loss value with proper decimal places
   */
  const formatProfitLoss = (value: number): string => {
    return `$${value.toFixed(DECIMAL_PLACES)}`;
  };

  /**
   * Helper: Format percentage value with proper decimal places
   */
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(DECIMAL_PLACES)}%`;
  };

  /**
   * Helper: Determine CSS class for profit/loss styling
   */
  const getProfitLossClass = (value: number): string => {
    return value >= 0 ? styles.profit : styles.loss;
  };

  /**
   * Handle edit button click
   * Scrolls to form and populates it with trade data
   */
  const handleEdit = (trade: Trade) => {
    tradeStore.setEditingTrade(trade);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle delete button click
   * Shows confirmation dialog before deleting
   */
  const handleDelete = async (id: string) => {
    if (window.confirm(DELETE_CONFIRMATION_MESSAGE)) {
      await tradeStore.deleteTrade(id);
    }
  };

  // Show empty state when no trades exist
  if (tradeStore.trades.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No trades yet. Create your first trade above!</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Size</th>
            <th>P/L</th>
            <th>P/L %</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tradeStore.trades.map((trade) => (
            <tr key={trade.id}>
              {/* Symbol */}
              <td className={styles.symbol}>{trade.symbol}</td>

              {/* Trade Type Badge */}
              <td>
                <span className={`${styles.badge} ${styles[trade.type]}`}>
                  {trade.type.toUpperCase()}
                </span>
              </td>

              {/* Prices */}
              <td>{formatCurrency(trade.entryPrice)}</td>
              <td>{formatCurrency(trade.exitPrice)}</td>

              {/* Position Size */}
              <td>{trade.size}</td>

              {/* Profit/Loss (color-coded) */}
              <td className={getProfitLossClass(trade.profitLoss)}>
                {formatProfitLoss(trade.profitLoss)}
              </td>

              {/* Profit/Loss Percentage (color-coded) */}
              <td className={getProfitLossClass(trade.profitLossPercent)}>
                {formatPercentage(trade.profitLossPercent)}
              </td>

              {/* Date */}
              <td>{trade.date}</td>

              {/* Notes */}
              <td className={styles.notes}>
                {trade.notes || EMPTY_NOTES_PLACEHOLDER}
              </td>

              {/* Action Buttons */}
              <td>
                <div className={styles.actions}>
                  <button
                    onClick={() => handleEdit(trade)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(trade.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TradeList;
