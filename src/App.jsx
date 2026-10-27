import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/AuthPages';
import PublicSignPage from './pages/PublicSignPage';
import { DashboardPage, ContractsPage, ContractFormPage, ContractDetailPage } from './pages/ContractPages';
import ProfilePage from './pages/ProfilePage';
import { AdminDashboardPage, AdminUsersPage, AdminAuditPage } from './pages/AdminPages';

function HomeRedirect() {
  const { user, loading, authError } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner" />Loading…</div>;
  if (authError) return <div className="sign-error"><h1>Unable to connect</h1><p>{authError}</p><button className="button primary" onClick={() => window.location.reload()}>Try again</button></div>;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />;
}

function RouterContent() {
  return <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/sign/:token" element={<PublicSignPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<RoleRoute role="user" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/new" element={<ContractFormPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
        </Route>
        <Route element={<RoleRoute role="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect />} />
  </Routes>;
}

export default function App() {
  return <AuthProvider><RouterContent /></AuthProvider>;
}
