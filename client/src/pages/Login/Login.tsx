import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores';
import styles from './Login.module.css';

const Login = observer(() => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = isLogin
      ? await authStore.login(username, password)
      : await authStore.register(username, password);

    if (success) {
      navigate('/dashboard');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    authStore.clearError();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trading Journal</h1>
      <h2 className={styles.subtitle}>{isLogin ? 'Login' : 'Register'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={styles.input}
          />
          {!isLogin && (
            <small className={styles.hint}>Minimum 6 characters</small>
          )}
        </div>

        {authStore.error && (
          <div className={styles.error}>{authStore.error}</div>
        )}

        <button
          type="submit"
          disabled={authStore.isLoading}
          className={styles.submitButton}
        >
          {authStore.isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>

      <p className={styles.toggleText}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={toggleMode} className={styles.toggleButton}>
          {isLogin ? 'Register here' : 'Login here'}
        </button>
      </p>
    </div>
  );
});

export default Login;