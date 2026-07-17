import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business, type BusinessStatus, formatPrice, primaryImage } from '../lib/types';

type MyBusiness = Business & { messagesCount: number; moderationNote?: string | null };

const STATUS_ORDER: BusinessStatus[] = ['draft', 'pending', 'published', 'sold', 'archived'];

const STATUS_COLORS: Record<BusinessStatus, { bg: string; fg: string }> = {
  draft: { bg: 'var(--color-bg)', fg: 'var(--color-text-secondary)' },
  pending: { bg: '#fef3c7', fg: '#b45309' },
  published: { bg: '#ecfdf5', fg: 'var(--color-success)' },
  sold: { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)' },
  archived: { bg: 'var(--color-bg)', fg: 'var(--color-text-secondary)' },
};

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const [businesses, setBusinesses] = useState<MyBusiness[] | null>(null);
  const justSubmitted = params.get('submitted') === '1';

  const load = useCallback(async () => {
    const { data } = await api.get<MyBusiness[]>('/businesses/mine');
    setBusinesses(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const archive = async (id: string) => {
    await api.post(`/businesses/${id}/archive`);
    await load();
  };

  const submit = async (id: string) => {
    await api.post(`/businesses/${id}/submit`);
    await load();
  };

  if (!businesses) return <p style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</p>;

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: businesses.filter((b) => b.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('dashboard.title')}</h1>
        <Link to="/sell">
          <button className="btn-primary" style={{ padding: '10px 20px' }}>+ {t('home.sellCta')}</button>
        </Link>
      </div>

      {justSubmitted && (
        <div className="card" style={{ padding: 'var(--space-4)', background: '#ecfdf5', color: 'var(--color-success)', marginBottom: 'var(--space-4)' }}>
          {t('dashboard.submittedNotice')}
        </div>
      )}

      {businesses.length === 0 && (
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('dashboard.empty')}</p>
          <Link to="/sell"><button className="btn-primary">{t('home.sellCta')}</button></Link>
        </div>
      )}

      {grouped.map(({ status, items }) => (
        <section key={status} style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>
            {t(`status.${status}`)} ({items.length})
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {items.map((b) => {
              const img = primaryImage(b);
              const c = STATUS_COLORS[b.status];
              return (
                <div key={b.id} className="card" style={{ padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-md)',
                        flexShrink: 0,
                        background: img ? `url(${img}) center/cover` : 'var(--color-primary-light)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</strong>
                        <span className="badge" style={{ background: c.bg, color: c.fg }}>{t(`status.${b.status}`)}</span>
                        {b.isPremium && <span className="badge badge-featured">{t('listing.featured')}</span>}
                      </div>
                      <p style={{ margin: '2px 0', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {formatPrice(b.askingPrice, b.country, i18n.language)}
                      </p>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        👁 {b.viewsCount} {t('dashboard.views')} · ✉ {b.messagesCount} {t('dashboard.messages')}
                      </p>
                    </div>
                  </div>

                  {b.status === 'draft' && b.moderationNote && (
                    <div style={{ background: '#fef2f2', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
                      <strong>{t('dashboard.rejectedReason')} :</strong> {b.moderationNote}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {(b.status === 'draft' || b.status === 'pending') && (
                      <Link to={`/sell?id=${b.id}`}>
                        <button style={actionBtn}>{t('dashboard.edit')}</button>
                      </Link>
                    )}
                    {b.status === 'draft' && (
                      <button style={{ ...actionBtn, background: 'var(--color-primary)', color: '#fff', border: 'none' }} onClick={() => void submit(b.id)}>
                        {t('sell.submit')}
                      </button>
                    )}
                    {b.status === 'published' && (
                      <Link to={`/businesses/${b.id}`}>
                        <button style={actionBtn}>{t('dashboard.view')}</button>
                      </Link>
                    )}
                    {b.status !== 'archived' && b.status !== 'sold' && (
                      <button style={{ ...actionBtn, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => void archive(b.id)}>
                        {t('dashboard.archive')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('dashboard.buyerSection')}</span>
        <Link to="/messages" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          {t('nav.messages')} →
        </Link>
      </section>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-full)',
  padding: '6px 14px',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
};
