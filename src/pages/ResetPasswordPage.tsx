import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { commonErrorKey, errorCode } from '../lib/errors';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';
import { noticeBox } from '../styles/ui';

const MIN_LENGTH = 8;

/** Choix d'un nouveau mot de passe à partir du jeton reçu par email. */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const canSubmit = password.length >= MIN_LENGTH && password === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('done');
    } catch (err) {
      const common = commonErrorKey(err);
      setError(
        common
          ? t(common)
          : errorCode(err) === 'INVALID_RESET_TOKEN'
            ? t('auth.resetInvalid')
            : t('common.error'),
      );
      setStatus('idle');
    }
  };

  // Lien tronqué ou ouvert à la main : inutile d'afficher le formulaire.
  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('auth.resetTitle')}</h1>
        <div style={errorBox}>{t('auth.resetInvalid')}</div>
        <Link to="/forgot-password" style={{ ...submitBtn, display: 'flex' }}>
          {t('auth.forgotSubmit')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('auth.resetTitle')}</h1>
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4)' }}>
        {status === 'done' ? (
          <>
            <div style={noticeBox}>{t('auth.resetDone')}</div>
            <button onClick={() => navigate('/login')} style={submitBtn}>
              {t('auth.login')}
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            {error && <div style={errorBox}>{error}</div>}

            <label style={label} htmlFor="password">
              {t('auth.newPassword')}
            </label>
            <input
              id="password"
              style={{ ...field, marginBottom: tooShort ? 4 : 'var(--space-3)' }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_LENGTH}
              autoComplete="new-password"
              required
            />
            {tooShort && (
              <p style={{ fontSize: 10, color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
                {t('auth.passwordTooShort', { count: MIN_LENGTH })}
              </p>
            )}

            <label style={label} htmlFor="confirm">
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirm"
              style={{
                ...field,
                marginBottom: mismatch ? 4 : 'var(--space-3)',
                borderColor: mismatch ? 'var(--color-danger)' : undefined,
              }}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {mismatch && (
              <p style={{ fontSize: 10, color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
                {t('auth.passwordMismatch')}
              </p>
            )}

            <button style={submitBtn} disabled={status === 'sending' || !canSubmit}>
              {status === 'sending' ? t('common.loading') : t('auth.resetSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
