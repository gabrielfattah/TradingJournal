import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
