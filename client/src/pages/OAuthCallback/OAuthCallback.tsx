import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStore } from '../../stores';
import styles from './OAuthCallback.module.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code from URL
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google authentication was cancelled or failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Send code to backend
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
    };

    handleCallback();
  }, [searchParams, navigate]);

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
