import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      authStore.error = 'No credential received from Google';
      return;
    }

    const success = await authStore.loginWithGoogle(credentialResponse.credential);

    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    authStore.error = 'Google login failed. Please try again.';
  };

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

      {/* Divider */}
      <div className={styles.divider}>
        <span>OR</span>
      </div>

      {/* Google Sign-In Button */}
      <div className={styles.googleButtonContainer}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          text={isLogin ? "signin_with" : "signup_with"}
        />
      </div>

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