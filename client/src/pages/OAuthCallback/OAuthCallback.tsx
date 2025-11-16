/**
 * OAuth Callback Page
 * Handles Google OAuth redirect flow (both credential and authorization code)
 * Processes authentication tokens and redirects to dashboard or login
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../stores';
import styles from './OAuthCallback.module.css';

// Constants
const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const REDIRECT_DELAY = 3000; // 3 seconds

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper: Redirect to login after showing error
   */
  const redirectToLogin = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => navigate(LOGIN_ROUTE), REDIRECT_DELAY);
  };

  /**
   * Helper: Process OAuth authentication result
   * Handles both success and failure cases with appropriate navigation
   */
  const processAuthResult = async (
    authFunction: () => Promise<boolean>,
    fallbackError: string
  ): Promise<void> => {
    try {
      const success = await authFunction();

      if (success) {
        navigate(DASHBOARD_ROUTE);
      } else {
        redirectToLogin(authStore.error || fallbackError);
      }
    } catch (err) {
      redirectToLogin('An unexpected error occurred');
    }
  };

  /**
   * Effect: Handle OAuth callback on mount
   * Extracts tokens from URL and processes authentication
   */
  useEffect(() => {
    const handleCallback = async () => {
      // Extract credential from hash fragment (popup mode)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const credential = hashParams.get('id_token') || hashParams.get('credential');

      // Extract code and error from query parameters (redirect mode)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // Handle OAuth error (user cancelled or provider error)
      if (errorParam) {
        redirectToLogin('Google authentication was cancelled or failed');
        return;
      }

      // Try credential-based authentication first (popup/redirect mode)
      if (credential) {
        await processAuthResult(
          () => authStore.loginWithGoogle(credential),
          'Login failed'
        );
        return;
      }

      // Fallback to authorization code flow
      if (code) {
        await processAuthResult(
          () => authStore.loginWithGoogleCode(code),
          'Login failed'
        );
        return;
      }

      // No authentication data found in URL
      redirectToLogin('No authentication data received');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {error ? (
          // Error State
          <>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.errorTitle}>Authentication Failed</h2>
            <p className={styles.errorMessage}>{error}</p>
            <p className={styles.redirect}>Redirecting to login...</p>
          </>
        ) : (
          // Loading State
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
