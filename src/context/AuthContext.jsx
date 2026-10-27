import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { errorMessage, setAccessToken } from '../api/client';

const AuthContext = createContext(null);
let initialRefreshRequest = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const refresh = useCallback(async () => {
    initialRefreshRequest ||= (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.accessToken);
        const profile = await api.get('/users/me');
        setUser(profile.data.user);
        return profile.data.user;
      } catch (failure) {
        setAccessToken(null);
        setUser(null);
        if (failure.response?.status === 401) return null;
        throw failure;
      }
    })().finally(() => { initialRefreshRequest = null; });
    return initialRefreshRequest;
  }, []);

  useEffect(() => {
    refresh().catch((failure) => setAuthError(errorMessage(failure))).finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setAuthError('');
    return data.user;
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, authError, login, logout, refresh, setUser }), [user, loading, authError, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
