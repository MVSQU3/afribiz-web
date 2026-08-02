import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business, type BusinessStatus, formatPrice } from '../lib/types';
import { btnSmall, errorBox, overlineStrong, successBox } from '../styles/ui';

type MyBusiness = Business & {
  messagesCount: number;
  moderationNote?: string | null;
  needsReview?: boolean;
};

const STATUS_ORDER: BusinessStatus[] = ['draft', 'pending', 'published', 'sold', 'archived'];

/** Chaque statut a son traitement : plein accent, champ lime, ou simple filet. */
const STATUS_STYLES: Record<BusinessStatus, React.CSSProperties> = {
  draft: { border: '1px solid var(--color-divider)', color: 'var(--color-text)' },
  pending: { background: 'var(--color-highlight)', color: 'var(--color-text)' },
  published: { background: 'var(--color-accent)', color: 'var(--color-bg)' },
  sold: { background: 'var(--color-text)', color: 'var(--color-highlight)' },
  archived: { border: '1px solid var(--color-rule)', color: 'var(--color-neutral-700)' },
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

  if (!businesses) return <p style={{ color: 'var(--color-neutral-700)' }}>{t('common.loading')}</p>;

  const totalViews = businesses.reduce((sum, b) => sum + b.viewsCount, 0);
  const totalMessages = businesses.reduce((sum, b) => sum + b.messagesCount, 0);

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: businesses.filter((b) => b.status === status),
  })).filter((g) => g.items.length > 0);

  const kpi = (value: string | number, labelKey: string, last = false) => (
    <div style={{ padding: '12px 14px', borderRight: last ? undefined : '1px solid var(--color-rule)' }}>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</p>
      <p
        style={{
          margin: 0,
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-neutral-700)',
        }}
      >
        {t(labelKey)}
      </p>
    </div>
  );

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('dashboard.title')}</h1>
        <Link to="/profile" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent-700)' }}>
          {t('profile.title')}
        </Link>
      </div>

      {/* Trois compteurs en grille à filets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        {kpi(businesses.length, 'dashboard.listings')}
        {kpi(totalViews.toLocaleString(i18n.language), 'dashboard.views')}
        {kpi(totalMessages, 'dashboard.messages', true)}
      </div>

      <div style={{ padding: 'var(--space-4)' }}>
        {justSubmitted && <div style={successBox}>{t('dashboard.submittedNotice')}</div>}
        {params.get('updated') === '1' && (
          <div style={successBox}>{t('dashboard.updatedNotice')}</div>
        )}

        {businesses.length === 0 && (
          <div style={{ border: '2px solid var(--color-divider)', padding: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>{t('dashboard.empty')}</p>
            <Link to="/sell" className="btn-primary" style={{ display: 'inline-block' }}>
              {t('home.sellCta')}
            </Link>
          </div>
        )}

        {businesses.length > 0 && (
          <Link
            to="/sell"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'left', marginBottom: 'var(--space-4)' }}
          >
            + {t('home.sellCta')}
          </Link>
        )}

        {grouped.map(({ status, items }) => (
          <section key={status} style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ ...overlineStrong, marginBottom: 0 }}>
              {t(`status.${status}`)} ({items.length})
            </p>
            {items.map((b) => (
              <div key={b.id} style={{ padding: 'var(--space-3) 0', borderTop: '1px solid var(--color-rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.title}
                  </p>
                  <span style={{ display: 'flex', gap: 4, flex: 'none' }}>
                    {/* Une annonce modifiée reste en ligne : on le dit, sinon
                        le vendeur croit sa correction bloquée. */}
                    {b.needsReview && (
                      <span
                        className="badge"
                        style={{ background: 'var(--color-highlight)', color: 'var(--color-text)', height: 18 }}
                      >
                        {t('dashboard.underReview')}
                      </span>
                    )}
                    <span className="badge" style={{ ...STATUS_STYLES[b.status], height: 18 }}>
                      {t(`status.${b.status}`)}
                    </span>
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-accent-700)' }}>
                  {formatPrice(b.askingPrice, b.country, i18n.language)}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
                  {b.viewsCount} {t('dashboard.views')} · {b.messagesCount} {t('dashboard.messages')}
                </p>

                {b.status === 'draft' && b.moderationNote && (
                  <div style={{ ...errorBox, marginTop: 'var(--space-3)', marginBottom: 0 }}>
                    <strong>{t('dashboard.rejectedReason')} :</strong> {b.moderationNote}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                  {(b.status === 'draft' || b.status === 'pending' || b.status === 'published') && (
                    <Link to={`/sell?id=${b.id}`} style={btnSmall}>
                      {t('dashboard.edit')}
                    </Link>
                  )}
                  {b.status === 'draft' && (
                    <button
                      style={{
                        ...btnSmall,
                        background: 'var(--color-accent)',
                        color: 'var(--color-bg)',
                        borderColor: 'var(--color-accent)',
                      }}
                      onClick={() => void submit(b.id)}
                    >
                      {t('sell.submit')}
                    </button>
                  )}
                  {b.status === 'published' && (
                    <Link to={`/businesses/${b.id}`} style={btnSmall}>
                      {t('dashboard.view')}
                    </Link>
                  )}
                  {b.status !== 'archived' && b.status !== 'sold' && (
                    <button
                      style={{ ...btnSmall, color: 'var(--color-neutral-700)', borderColor: 'var(--color-rule)' }}
                      onClick={() => void archive(b.id)}
                    >
                      {t('dashboard.archive')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        ))}

        <section style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 'var(--space-3)' }}>
          <p style={{ ...overlineStrong, marginBottom: 'var(--space-2)' }}>{t('dashboard.buyerSection')}</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link
              to="/messages"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent-700)' }}
            >
              {t('nav.messages')} →
            </Link>
            <Link
              to="/favorites"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent-700)' }}
            >
              {t('favorites.title')} →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
