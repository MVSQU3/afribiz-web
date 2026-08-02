import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { COUNTRIES } from '../lib/types';
import { useAuthStore, type User } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';
import { avatar, initials, segGroup, segOption, successBox } from '../styles/ui';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, fetchMe, logout } = useAuthStore();
  const { setLanguage } = useAppStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    country: 'CI',
    language: 'fr' as 'fr' | 'en',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        language: user.language,
      });
    }
  }, [user]);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { data } = await api.patch<User>('/users/me', form);
      setLanguage(data.language); // Applique la langue immédiatement
      await fetchMe();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  };

  if (!user) return <p>{t('common.loading')}</p>;

  /** Ligne de renvoi : libellé à gauche, valeur ou action à droite. */
  const linkRow = (labelText: string, value: string, to?: string) => {
    const content = (
      <>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{labelText}</p>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: to ? 'var(--color-accent-700)' : 'var(--color-neutral-700)',
          }}
        >
          {value}
        </span>
      </>
    );
    const style = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--color-rule)',
    } as const;
    return to ? (
      <Link to={to} style={style}>
        {content}
      </Link>
    ) : (
      <div style={style}>{content}</div>
    );
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      {/* Identité */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 'var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <div style={avatar(52)}>{initials(user.firstName, user.lastName)}</div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>
            {user.firstName} {user.lastName}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            {user.isVerified ? t('profile.verified') : t('profile.unverified')} ·{' '}
            {t(`countries.${user.country}`)}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto', padding: 'var(--space-4)' }}>
        <form onSubmit={onSubmit}>
          {status === 'error' && <div style={errorBox}>{t('common.error')}</div>}
          {status === 'saved' && <div style={successBox}>{t('profile.saved')}</div>}

          <label style={label}>{t('auth.email')}</label>
          <input style={{ ...field, color: 'var(--color-neutral-600)' }} value={user.email} disabled />

          <label style={label}>{t('auth.phone')}</label>
          <input style={{ ...field, color: 'var(--color-neutral-600)' }} value={user.phone} disabled />

          <label style={label}>{t('auth.firstName')}</label>
          <input style={field} value={form.firstName} onChange={set('firstName')} required />

          <label style={label}>{t('auth.lastName')}</label>
          <input style={field} value={form.lastName} onChange={set('lastName')} required />

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

          <label style={label}>{t('profile.language')}</label>
          <div style={segGroup}>
            {(['fr', 'en'] as const).map((lng, i) => (
              <button
                key={lng}
                type="button"
                onClick={() => setForm((f) => ({ ...f, language: lng }))}
                style={{
                  ...segOption(form.language === lng, i === 0),
                  padding: '10px 6px',
                  background: form.language === lng ? 'var(--color-text)' : 'transparent',
                  color: form.language === lng ? 'var(--color-highlight)' : 'var(--color-text)',
                }}
              >
                {lng === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>

          <button style={submitBtn} disabled={status === 'saving'}>
            {status === 'saving' ? t('common.loading') : t('profile.save')}
          </button>
        </form>

        {/* Renvois */}
        <div style={{ marginTop: 'var(--space-6)', borderTop: '2px solid var(--color-divider)', paddingTop: 4 }}>
          {linkRow(t('profile.myListings'), '→', '/dashboard')}
          {linkRow(t('favorites.title'), '→', '/favorites')}
          {linkRow(t('nav.messages'), '→', '/messages')}
          {user.role === 'admin' && linkRow(t('nav.admin'), t('profile.open'), '/admin')}
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          style={{
            marginTop: 'var(--space-4)',
            border: 0,
            background: 'transparent',
            padding: 0,
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-danger)',
          }}
        >
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}
