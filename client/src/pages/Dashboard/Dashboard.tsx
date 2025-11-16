import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore, tradeStore } from '../../stores';
import TradeForm from '../../components/TradeForm/TradeForm';
import TradeList from '../../components/TradeList/TradeList';
import styles from './Dashboard.module.css';

const Dashboard = observer(() => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate('/login');
    } else {
      tradeStore.fetchTrades();
    }
  }, [navigate]);

  const handleLogout = () => {
    authStore.logout();
    navigate('/login');
  };

  if (tradeStore.isLoading && tradeStore.trades.length === 0) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
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

      {tradeStore.error && (
        <div className={styles.error}>
          {tradeStore.error}
          <button type="button" onClick={() => tradeStore.clearError()}>
            ×
          </button>
        </div>
      )}

      <TradeForm />

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