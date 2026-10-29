import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="container section center muted">Loading…</div>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="container section center muted">Loading…</div>;
  return user?.role === 'admin' ? children : <Navigate to="/admin/login" replace />;
}
