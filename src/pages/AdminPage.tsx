import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business, formatPrice } from '../lib/types';
import { useAuthStore } from '../stores/auth.store';
import { field, errorBox } from '../components/auth/AuthForm.css';
import { btnSmall, overline } from '../styles/ui';
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

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'moderation', labelKey: 'admin.moderation' },
  { key: 'reports', labelKey: 'admin.reports' },
  { key: 'users', labelKey: 'admin.users' },
  { key: 'seed', labelKey: 'admin.seed' },
];

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
      } else if (tab === 'users') {
        const { data } = await api.get<AdminUser[]>('/admin/users', {
          params: search ? { q: search } : {},
        });
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

  const dangerBtn = {
    ...btnSmall,
    background: 'var(--color-danger)',
    color: 'var(--color-bg)',
    borderColor: 'var(--color-danger)',
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      {/* En-tête sombre — l'admin est le seul écran à fond inversé */}
      <div style={{ background: 'var(--color-text)', color: 'var(--color-bg)', padding: 'var(--space-3) var(--space-4)' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{t('admin.title')}</h1>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-2)',
          }}
        >
          {t('admin.pendingCount', { count: pending.length })}
        </p>
      </div>

      {/* Onglets jointifs, l'actif en champ lime */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-divider)' }}>
        {TABS.map((item, i) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              flex: 1,
              padding: '10px 6px',
              fontSize: '10px',
              fontWeight: tab === item.key ? 800 : 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: 0,
              borderLeft: i === 0 ? 0 : '1px solid var(--color-rule)',
              background: tab === item.key ? 'var(--color-highlight)' : 'transparent',
              color: tab === item.key ? 'var(--color-text)' : 'var(--color-neutral-700)',
            }}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div style={{ padding: 'var(--space-4)' }}>
        {error && <div style={errorBox}>{error}</div>}

        {tab === 'moderation' && (
          <>
            {pending.length === 0 && (
              <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
                {t('admin.emptyQueue')}
              </p>
            )}
            {pending.map((b) => (
              <div key={b.id} style={{ padding: '13px 0', borderTop: '1px solid var(--color-rule)' }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, lineHeight: 1.15 }}>
                  {b.title}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
                  {t('admin.by')} {b.seller?.firstName} · {b.images?.length ?? 0} {t('admin.photos')} ·{' '}
                  {t(`sectors.${b.sector}`)} · {formatPrice(b.askingPrice, b.country, i18n.language)}
                </p>
                <p
                  style={{
                    margin: 'var(--space-2) 0 0',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.5,
                    color: 'var(--color-neutral-800)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 120,
                    overflow: 'auto',
                  }}
                >
                  {b.description}
                </p>

                {rejecting === b.id ? (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ ...overline, marginBottom: 5 }}>{t('admin.rejectReason')}</p>
                    <textarea
                      style={{ ...field, minHeight: 60, resize: 'vertical' }}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={dangerBtn}
                        disabled={!reason.trim()}
                        onClick={() =>
                          void act(() =>
                            api.post(`/admin/businesses/${b.id}/reject`, { reason }),
                          ).then(() => {
                            setRejecting(null);
                            setReason('');
                          })
                        }
                      >
                        {t('admin.confirmReject')}
                      </button>
                      <button onClick={() => setRejecting(null)} style={btnSmall}>
                        {t('admin.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button
                      style={{
                        ...btnSmall,
                        background: 'var(--color-accent)',
                        color: 'var(--color-bg)',
                        borderColor: 'var(--color-accent)',
                      }}
                      onClick={() => void act(() => api.post(`/admin/businesses/${b.id}/approve`))}
                    >
                      {t('admin.approve')}
                    </button>
                    <button
                      onClick={() => setRejecting(b.id)}
                      style={{ ...btnSmall, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                      {t('admin.reject')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'reports' && (
          <>
            {reports.length === 0 && (
              <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
                {t('admin.noReports')}
              </p>
            )}
            {reports.map((r) => (
              <div key={r.id} style={{ padding: '13px 0', borderTop: '1px solid var(--color-rule)' }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>{r.business?.title}</p>
                <p style={{ margin: '3px 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-800)' }}>
                  {r.reason}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
                  {t('admin.reportedBy')} {r.reporter?.firstName} ({r.reporter?.email})
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                  <button
                    style={{
                      ...btnSmall,
                      background: 'var(--color-accent)',
                      color: 'var(--color-bg)',
                      borderColor: 'var(--color-accent)',
                    }}
                    onClick={() => void act(() => api.post(`/admin/reports/${r.id}/resolve`))}
                  >
                    {t('admin.resolve')}
                  </button>
                  <button
                    style={btnSmall}
                    onClick={() => void act(() => api.post(`/admin/reports/${r.id}/dismiss`))}
                  >
                    {t('admin.dismiss')}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'users' && (
          <>
            <input
              style={field}
              placeholder={t('admin.searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 0',
                  borderTop: '1px solid var(--color-rule)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>
                    {u.firstName} {u.lastName}{' '}
                    <span className="badge badge-outline">{u.role}</span>
                    {u.isSuspended && (
                      <span
                        className="badge"
                        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                      >
                        {t('admin.suspended')}
                      </span>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
                    {u.email} · {u.phone}
                  </p>
                </div>
                {u.role !== 'admin' && (
                  <button
                    onClick={() =>
                      void act(() =>
                        api.post(`/admin/users/${u.id}/${u.isSuspended ? 'unsuspend' : 'suspend'}`),
                      )
                    }
                    style={{
                      ...btnSmall,
                      flexShrink: 0,
                      color: u.isSuspended ? 'var(--color-text)' : 'var(--color-danger)',
                      borderColor: u.isSuspended ? 'var(--color-divider)' : 'var(--color-danger)',
                    }}
                  >
                    {u.isSuspended ? t('admin.unsuspend') : t('admin.suspend')}
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'seed' && <SeedListingForm />}
      </div>
    </div>
  );
}
