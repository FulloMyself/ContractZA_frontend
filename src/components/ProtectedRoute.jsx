import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner" />Loading your workspace…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}
