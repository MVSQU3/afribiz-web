import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { commonErrorKey, errorCode } from '../lib/errors';
import { useAuthStore } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';
import { segGroup, segOption } from '../styles/ui';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { language, setLanguage } = useAppStore();
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
      const common = commonErrorKey(err);
      if (common) {
        setError(t(common));
      } else {
        setError(
          errorCode(err) === 'INVALID_CREDENTIALS'
            ? t('auth.invalidCredentials')
            : t('common.error'),
        );
      }
    }
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      {/* Bandeau de marque sombre — l'ancrage de l'écran 09 */}
      <div style={{ background: 'var(--color-text)', color: 'var(--color-bg)', padding: 'var(--space-6) var(--space-4)' }}>
        <p className="wordmark" style={{ fontSize: 20, marginBottom: 2 }}>
          {t('app.name')}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', letterSpacing: '0.04em', color: 'var(--color-accent-2)' }}>
          {t('app.tagline')}
        </p>
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
        <h1 style={{ fontSize: 30, letterSpacing: '-0.03em', marginBottom: 'var(--space-4)' }}>
          {t('auth.login')}
        </h1>
        <form onSubmit={onSubmit}>
          {error && <div style={errorBox}>{error}</div>}
          <label style={label} htmlFor="identifier">
            {t('auth.identifier')}
          </label>
          <input
            id="identifier"
            style={{ ...field, marginBottom: 4 }}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <p style={{ fontSize: 10, color: 'var(--color-neutral-600)', marginBottom: 'var(--space-3)' }}>
            email@exemple.com / +225…
          </p>
          <label style={label} htmlFor="password">
            {t('auth.password')}
          </label>
          <input
            id="password"
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
        <p style={{ marginTop: 'var(--space-3)' }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent-700)' }}
          >
            {t('auth.forgotLink')}
          </Link>
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-2)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" style={{ fontWeight: 800, color: 'var(--color-accent-700)' }}>
            {t('auth.register')}
          </Link>
        </p>
      </div>

      {/* Bascule de langue en pied d'écran, comme sur la maquette */}
      <div style={{ ...segGroup, borderLeft: 0, borderRight: 0, borderBottom: 0, marginBottom: 0 }}>
        {(['fr', 'en'] as const).map((lng, i) => (
          <button
            key={lng}
            onClick={() => setLanguage(lng)}
            style={{
              ...segOption(language === lng, i === 0),
              padding: '12px 6px',
              textTransform: 'none',
              background: language === lng ? 'var(--color-text)' : 'transparent',
              color: language === lng ? 'var(--color-highlight)' : 'var(--color-text)',
            }}
          >
            {lng === 'fr' ? 'Français' : 'English'}
          </button>
        ))}
      </div>
    </div>
  );
}
