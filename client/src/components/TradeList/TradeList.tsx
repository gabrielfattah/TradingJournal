import { observer } from 'mobx-react-lite';
import { tradeStore } from '../../stores';
import type { Trade } from '../../types';
import styles from './TradeList.module.css';

const TradeList = observer(() => {
  const handleEdit = (trade: Trade) => {
    tradeStore.setEditingTrade(trade);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      await tradeStore.deleteTrade(id);
    }
  };

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
              <td className={styles.symbol}>{trade.symbol}</td>
              <td>
                <span className={`${styles.badge} ${styles[trade.type]}`}>
                  {trade.type.toUpperCase()}
                </span>
              </td>
              <td>${trade.entryPrice.toLocaleString()}</td>
              <td>${trade.exitPrice.toLocaleString()}</td>
              <td>{trade.size}</td>
              <td className={trade.profitLoss >= 0 ? styles.profit : styles.loss}>
                ${trade.profitLoss.toFixed(2)}
              </td>
              <td className={trade.profitLossPercent >= 0 ? styles.profit : styles.loss}>
                {trade.profitLossPercent.toFixed(2)}%
              </td>
              <td>{trade.date}</td>
              <td className={styles.notes}>{trade.notes || '-'}</td>
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