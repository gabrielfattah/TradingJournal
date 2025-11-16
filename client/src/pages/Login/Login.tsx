/**
 * Login/Registration Page
 * Provides username/password authentication and Google OAuth sign-in
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { authStore } from '../../stores';
import styles from './Login.module.css';

// Constants
const MIN_PASSWORD_LENGTH = 6;
const DASHBOARD_ROUTE = '/dashboard';

const Login = observer(() => {
  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  /**
   * Handle form submission for both login and registration
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = isLogin
      ? await authStore.login(username, password)
      : await authStore.register(username, password);

    if (success) {
      navigate(DASHBOARD_ROUTE);
    }
  };

  /**
   * Handle username input changes
   */
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  /**
   * Handle password input changes
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  /**
   * Handle successful Google authentication
   */
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      authStore.error = 'No credential received from Google';
      return;
    }

    const success = await authStore.loginWithGoogle(credentialResponse.credential);

    if (success) {
      navigate(DASHBOARD_ROUTE);
    }
  };

  /**
   * Handle Google authentication errors
   */
  const handleGoogleError = () => {
    authStore.error = 'Google login failed. Please try again.';
  };

  /**
   * Toggle between login and registration modes
   * Clears form fields and errors when switching
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    authStore.clearError();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trading Journal</h1>
      <h2 className={styles.subtitle}>{isLogin ? 'Login' : 'Register'}</h2>

      {/* Username/Password Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className={styles.input}
          />
          {!isLogin && (
            <small className={styles.hint}>Minimum {MIN_PASSWORD_LENGTH} characters</small>
          )}
        </div>

        {/* Error Message Display */}
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

      {/* Divider */}
      <div className={styles.divider}>
        <span>OR</span>
      </div>

      {/* Google Sign-In Button */}
      <div className={styles.googleButtonContainer}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          text={isLogin ? "signin_with" : "signup_with"}
          theme="filled_black"
        />
      </div>

      {/* Mode Toggle Link */}
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
