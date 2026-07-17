import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';

const COUNTRIES = ['CI', 'SN', 'BJ', 'TG', 'NG', 'GH'] as const;

const ERROR_CODES: Record<string, string> = {
  EMAIL_TAKEN: 'auth.emailTaken',
  PHONE_TAKEN: 'auth.phoneTaken',
  INVALID_PHONE: 'auth.invalidPhone',
};

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { language } = useAppStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    country: 'CI',
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ ...form, language });
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ code?: string }>;
      const key = ERROR_CODES[axiosErr.response?.data?.code ?? ''];
      setError(key ? t(key) : t('common.error'));
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t('auth.register')}</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: 'var(--space-6)' }}>
        {error && <div style={errorBox}>{error}</div>}
        <label style={label}>{t('auth.firstName')}</label>
        <input style={field} value={form.firstName} onChange={set('firstName')} required />
        <label style={label}>{t('auth.lastName')}</label>
        <input style={field} value={form.lastName} onChange={set('lastName')} required />
        <label style={label}>{t('auth.email')}</label>
        <input style={field} type="email" value={form.email} onChange={set('email')} required />
        <label style={label}>{t('auth.phone')}</label>
        <input style={field} value={form.phone} onChange={set('phone')} placeholder="+2250701020304" required />
        <label style={label}>{t('auth.country')}</label>
        <select style={field} value={form.country} onChange={set('country')}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {t(`countries.${c}`)}
            </option>
          ))}
        </select>
        <label style={label}>{t('auth.password')}</label>
        <input
          style={field}
          type="password"
          value={form.password}
          onChange={set('password')}
          minLength={8}
          autoComplete="new-password"
          required
        />
        <button style={submitBtn} disabled={isLoading}>
          {isLoading ? t('common.loading') : t('auth.register')}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {t('auth.hasAccount')}{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
