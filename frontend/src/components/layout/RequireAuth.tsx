import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Gates protected routes: unauthenticated users are redirected to /login
 * (preserving the intended destination). While the initial /auth/me check
 * is in flight we render a lightweight loading state rather than flashing
 * the login screen for already-authenticated users.
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card card" style={{ textAlign: 'center' }}>
          Loading your workspace…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
