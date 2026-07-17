import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuthStore, type User } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';

const COUNTRIES = ['CI', 'SN', 'BJ', 'TG', 'NG', 'GH'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuthStore();
  const { setLanguage } = useAppStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', country: 'CI', language: 'fr' as 'fr' | 'en' });
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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t('profile.title')}</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: 'var(--space-6)' }}>
        {status === 'error' && <div style={errorBox}>{t('common.error')}</div>}
        {status === 'saved' && (
          <div style={{ ...errorBox, background: '#ecfdf5', color: 'var(--color-success)' }}>
            {t('profile.saved')}
          </div>
        )}
        <label style={label}>{t('auth.email')}</label>
        <input style={{ ...field, opacity: 0.6 }} value={user.email} disabled />
        <label style={label}>{t('auth.phone')}</label>
        <input style={{ ...field, opacity: 0.6 }} value={user.phone} disabled />
        <label style={label}>{t('auth.firstName')}</label>
        <input style={field} value={form.firstName} onChange={set('firstName')} required />
        <label style={label}>{t('auth.lastName')}</label>
        <input style={field} value={form.lastName} onChange={set('lastName')} required />
        <label style={label}>{t('auth.country')}</label>
        <select style={field} value={form.country} onChange={set('country')}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{t(`countries.${c}`)}</option>
          ))}
        </select>
        <label style={label}>{t('profile.language')}</label>
        <select style={field} value={form.language} onChange={set('language')}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <button style={submitBtn} disabled={status === 'saving'}>
          {status === 'saving' ? t('common.loading') : t('profile.save')}
        </button>
      </form>
    </div>
  );
}
