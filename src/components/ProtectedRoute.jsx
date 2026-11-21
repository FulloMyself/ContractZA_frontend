import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safeReturnTo } from '../utils/returnTo';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen"><span className="spinner" />Loading your workspace…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ returnTo: safeReturnTo(location.pathname) }} />;
}

export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}
