import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [ready, setReady] = useState(false);

  const save = (token, u) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    if (localStorage.getItem('token')) {
      api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => {}).finally(() => setReady(true));
    } else setReady(true);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    save(data.token, data.user);
    return data.user;
  };
  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    save(data.token, data.user);
    return data.user;
  };

  return <AuthContext.Provider value={{ user, ready, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}
