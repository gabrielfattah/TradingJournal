/**
 * Dashboard Page
 * Main page for authenticated users to manage their trading journal
 * Displays trade form, trade list, and user information
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore, tradeStore } from '../../stores';
import TradeForm from '../../components/TradeForm/TradeForm';
import TradeList from '../../components/TradeList/TradeList';
import styles from './Dashboard.module.css';

// Constants
const LOGIN_ROUTE = '/login';

const Dashboard = observer(() => {
  const navigate = useNavigate();

  /**
   * Effect: Verify authentication and fetch trades on mount
   * Redirects to login if user is not authenticated
   */
  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate(LOGIN_ROUTE);
    } else {
      tradeStore.fetchTrades();
    }
  }, [navigate]);

  /**
   * Handle user logout
   * Clears session and redirects to login page
   */
  const handleLogout = () => {
    authStore.logout();
    navigate(LOGIN_ROUTE);
  };

  // Show loading state only on initial load (when no trades are cached)
  if (tradeStore.isLoading && tradeStore.trades.length === 0) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Trading Journal</h1>
          <p className={styles.welcome}>
            Welcome, <strong>{authStore.username}</strong>!
          </p>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Error Message Display */}
      {tradeStore.error && (
        <div className={styles.error}>
          {tradeStore.error}
          <button type="button" onClick={() => tradeStore.clearError()}>
            ×
          </button>
        </div>
      )}

      {/* Trade Form (Create/Edit) */}
      <TradeForm />

      {/* Trades List Section */}
      <div className={styles.tradesSection}>
        <h2 className={styles.tradesTitle}>
          Your Trades ({tradeStore.trades.length})
        </h2>
        <TradeList />
      </div>
    </div>
  );
});

export default Dashboard;
