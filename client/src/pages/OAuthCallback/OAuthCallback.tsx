import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../stores';
import styles from './OAuthCallback.module.css';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Google redirects with credential in hash fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const credential = hashParams.get('id_token') || hashParams.get('credential');

      // Also check query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google authentication was cancelled or failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Try credential first (for redirect mode with GoogleLogin)
      if (credential) {
        try {
          const success = await authStore.loginWithGoogle(credential);

          if (success) {
            navigate('/dashboard');
          } else {
            setError(authStore.error || 'Login failed');
            setTimeout(() => navigate('/login'), 3000);
          }
        } catch (err) {
          setError('An unexpected error occurred');
          setTimeout(() => navigate('/login'), 3000);
        }
        return;
      }

      // Fallback to code (for auth-code flow)
      if (code) {
        try {
          const success = await authStore.loginWithGoogleCode(code);

          if (success) {
            navigate('/dashboard');
          } else {
            setError(authStore.error || 'Login failed');
            setTimeout(() => navigate('/login'), 3000);
          }
        } catch (err) {
          setError('An unexpected error occurred');
          setTimeout(() => navigate('/login'), 3000);
        }
        return;
      }

      // No credential or code found
      setError('No authentication data received');
      setTimeout(() => navigate('/login'), 3000);
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {error ? (
          <>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.errorTitle}>Authentication Failed</h2>
            <p className={styles.errorMessage}>{error}</p>
            <p className={styles.redirect}>Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Signing you in...</h2>
            <p className={styles.message}>Please wait while we complete your authentication</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
