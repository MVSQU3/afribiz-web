import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

/** Protège les routes enfants : redirige vers /login si non connecté. */
export function RequireAuth() {
  const { user, fetchMe } = useAuthStore();
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem('accessToken'));

  useEffect(() => {
    if (hasToken && !user) void fetchMe();
  }, [hasToken, user, fetchMe]);

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
