import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business, formatPrice, primaryImage } from '../lib/types';
import { useAuthStore } from '../stores/auth.store';
import { field, errorBox } from '../components/auth/AuthForm.css';
import { SeedListingForm } from '../components/admin/SeedListingForm';

interface Report {
  id: string;
  reason: string;
  createdAt: string;
  business: { id: string; title: string };
  reporter: { id: string; firstName: string; email: string };
}

interface AdminUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  isSuspended: boolean;
}

type Tab = 'moderation' | 'reports' | 'users' | 'seed';

export function AdminPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('moderation');
  const [pending, setPending] = useState<Business[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (tab === 'moderation') {
        const { data } = await api.get<Business[]>('/admin/businesses/pending');
        setPending(data);
      } else if (tab === 'reports') {
        const { data } = await api.get<Report[]>('/admin/reports');
        setReports(data);
      } else {
        const { data } = await api.get<AdminUser[]>('/admin/users', { params: search ? { q: search } : {} });
        setUsers(data);
      }
    } catch {
      setError(t('common.error'));
    }
  }, [tab, search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!user) return null; // RequireAuth gère la redirection

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch {
      setError(t('common.error'));
    }
  };

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        border: 'none',
        background: tab === key ? 'var(--color-primary)' : 'var(--color-surface)',
        color: tab === key ? '#fff' : 'inherit',
        borderRadius: 'var(--radius-full)',
        padding: '8px 16px',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('admin.title')}</h1>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {tabBtn('moderation', `${t('admin.moderation')} (${pending.length})`)}
        {tabBtn('reports', t('admin.reports'))}
        {tabBtn('users', t('admin.users'))}
        {tabBtn('seed', t('admin.seed'))}
      </div>
      {error && <div style={errorBox}>{error}</div>}

      {tab === 'moderation' && (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {pending.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>{t('admin.emptyQueue')}</p>}
          {pending.map((b) => (
            <div key={b.id} className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {primaryImage(b) && (
                  <img src={primaryImage(b)!} alt="" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{b.title}</strong>
                  <p style={{ margin: '2px 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {b.city}, {t(`countries.${b.country}`)} · {t(`sectors.${b.sector}`)} ·{' '}
                    {formatPrice(b.askingPrice, b.country, i18n.language)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {t('admin.by')} {b.seller?.firstName} — {b.images?.length ?? 0} {t('admin.photos')}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>{b.description}</p>
              {rejecting === b.id ? (
                <div>
                  <textarea
                    style={{ ...field, minHeight: 60 }}
                    placeholder={t('admin.rejectReason')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn-primary"
                      style={{ background: 'var(--color-danger)' }}
                      disabled={!reason.trim()}
                      onClick={() => void act(() => api.post(`/admin/businesses/${b.id}/reject`, { reason })).then(() => { setRejecting(null); setReason(''); })}
                    >
                      {t('admin.confirmReject')}
                    </button>
                    <button onClick={() => setRejecting(null)} style={{ border: 'none', background: 'transparent' }}>
                      {t('admin.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn-primary" onClick={() => void act(() => api.post(`/admin/businesses/${b.id}/approve`))}>
                    ✓ {t('admin.approve')}
                  </button>
                  <button
                    onClick={() => setRejecting(b.id)}
                    style={{
                      border: '1px solid var(--color-danger)',
                      color: 'var(--color-danger)',
                      background: 'transparent',
                      borderRadius: 'var(--radius-full)',
                      padding: 'var(--space-3) var(--space-6)',
                      fontWeight: 600,
                    }}
                  >
                    ✕ {t('admin.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {reports.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>{t('admin.noReports')}</p>}
          {reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: 'var(--space-4)' }}>
              <strong>{r.business?.title}</strong>
              <p style={{ fontSize: 'var(--text-sm)' }}>{r.reason}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {t('admin.reportedBy')} {r.reporter?.firstName} ({r.reporter?.email})
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn-primary" onClick={() => void act(() => api.post(`/admin/reports/${r.id}/resolve`))}>
                  {t('admin.resolve')}
                </button>
                <button
                  onClick={() => void act(() => api.post(`/admin/reports/${r.id}/dismiss`))}
                  style={{ border: '1px solid var(--color-border)', background: 'transparent', borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)' }}
                >
                  {t('admin.dismiss')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'seed' && <SeedListingForm />}


      {tab === 'users' && (
        <div>
          <input
            style={field}
            placeholder={t('admin.searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {users.map((u) => (
              <div key={u.id} className="card" style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ minWidth: 0 }}>
                  <strong>{u.firstName} {u.lastName}</strong>{' '}
                  <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{u.role}</span>
                  {u.isSuspended && <span className="badge" style={{ background: '#fef2f2', color: 'var(--color-danger)' }}>{t('admin.suspended')}</span>}
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{u.email} · {u.phone}</p>
                </div>
                {u.role !== 'admin' && (
                  <button
                    onClick={() => void act(() => api.post(`/admin/users/${u.id}/${u.isSuspended ? 'unsuspend' : 'suspend'}`))}
                    style={{
                      border: `1px solid ${u.isSuspended ? 'var(--color-border)' : 'var(--color-danger)'}`,
                      color: u.isSuspended ? 'inherit' : 'var(--color-danger)',
                      background: 'transparent',
                      borderRadius: 'var(--radius-full)',
                      padding: '6px 12px',
                      fontSize: 'var(--text-sm)',
                      flexShrink: 0,
                    }}
                  >
                    {u.isSuspended ? t('admin.unsuspend') : t('admin.suspend')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
