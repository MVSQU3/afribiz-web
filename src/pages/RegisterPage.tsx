import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { commonErrorKey, errorCode } from '../lib/errors';
import { useAuthStore } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { COUNTRIES } from '../lib/types';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';
import { segGroup, segOption } from '../styles/ui';

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

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ ...form, language });
      navigate('/dashboard');
    } catch (err) {
      const key = commonErrorKey(err) ?? ERROR_CODES[errorCode(err) ?? ''];
      setError(key ? t(key) : t('common.error'));
    }
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('auth.register')}</h1>
      </div>

      <form onSubmit={onSubmit} style={{ maxWidth: 460, margin: '0 auto', padding: 'var(--space-4)' }}>
        {error && <div style={errorBox}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>{t('auth.firstName')}</label>
            <input style={field} value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>{t('auth.lastName')}</label>
            <input style={field} value={form.lastName} onChange={set('lastName')} required />
          </div>
        </div>

        <label style={label}>{t('auth.email')}</label>
        <input style={field} type="email" value={form.email} onChange={set('email')} required />

        <label style={label}>{t('auth.phone')}</label>
        <input
          style={{ ...field, marginBottom: 4, borderColor: 'var(--color-accent)' }}
          value={form.phone}
          onChange={set('phone')}
          placeholder="+2250701020304"
          required
        />
        <p style={{ fontSize: 10, color: 'var(--color-accent-700)', marginBottom: 'var(--space-3)' }}>
          {t('auth.phoneHint')}
        </p>

        {/* Pays : six cases jointives, l'active en accent plein */}
        <label style={label}>{t('auth.country')}</label>
        <div style={segGroup}>
          {COUNTRIES.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, country: c }))}
              style={segOption(form.country === c, i === 0)}
            >
              {c}
            </button>
          ))}
        </div>

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

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-3)' }}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" style={{ fontWeight: 800, color: 'var(--color-accent-700)' }}>
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
