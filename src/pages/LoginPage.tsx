import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ code?: string }>;
      setError(
        axiosErr.response?.data?.code === 'INVALID_CREDENTIALS'
          ? t('auth.invalidCredentials')
          : t('common.error'),
      );
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t('auth.login')}</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: 'var(--space-6)' }}>
        {error && <div style={errorBox}>{error}</div>}
        <label style={label}>{t('auth.identifier')}</label>
        <input
          style={field}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="email@exemple.com / +225..."
          autoComplete="username"
          required
        />
        <label style={label}>{t('auth.password')}</label>
        <input
          style={field}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button style={submitBtn} disabled={isLoading}>
          {isLoading ? t('common.loading') : t('auth.login')}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {t('auth.noAccount')}{' '}
        <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}
