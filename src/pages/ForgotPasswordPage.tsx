import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { commonErrorKey } from '../lib/errors';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';
import { noticeBox } from '../styles/ui';

/**
 * Demande de lien de réinitialisation.
 *
 * L'API répond toujours 200, que le compte existe ou non — l'écran affiche donc
 * le même message dans tous les cas, sans jamais confirmer qu'un compte existe.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorKey, setErrorKey] = useState('common.error');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post('/auth/forgot-password', { identifier });
      setStatus('sent');
    } catch (err) {
      setErrorKey(commonErrorKey(err) ?? 'common.error');
      setStatus('error');
    }
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('auth.forgotTitle')}</h1>
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4)' }}>
        {status === 'sent' ? (
          <>
            <div style={noticeBox}>{t('auth.forgotSent')}</div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-4)' }}>
              {t('auth.forgotSpam')}
            </p>
            <Link to="/login" style={{ ...submitBtn, display: 'flex' }}>
              {t('auth.login')}
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            {status === 'error' && <div style={errorBox}>{t(errorKey)}</div>}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>
              {t('auth.forgotIntro')}
            </p>
            <label style={label} htmlFor="identifier">
              {t('auth.identifier')}
            </label>
            <input
              id="identifier"
              style={field}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
            <button style={submitBtn} disabled={status === 'sending' || !identifier.trim()}>
              {status === 'sending' ? t('common.loading') : t('auth.forgotSubmit')}
            </button>
          </form>
        )}

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-4)' }}>
          <Link to="/login" style={{ fontWeight: 800, color: 'var(--color-accent-700)' }}>
            ← {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
