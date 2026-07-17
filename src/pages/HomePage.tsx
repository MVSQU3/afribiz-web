import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type SearchResult } from '../lib/types';
import { BusinessCard } from '../components/listings/BusinessCard';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState<SearchResult | null>(null);

  useEffect(() => {
    void api.get<SearchResult>('/businesses', { params: { limit: 6 } }).then(({ data }) => setFeatured(data));
  }, []);

  return (
    <div>
      <section style={{ padding: 'var(--space-6) 0' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>{t('home.title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 0 }}>{t('home.subtitle')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-base)',
              background: 'var(--color-surface)',
              boxSizing: 'border-box',
            }}
          />
        </form>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{t('home.featured')}</h2>
          <Link to="/search" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {t('common.seeAll')}
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {featured?.items.map((b) => <BusinessCard key={b.id} business={b} />)}
          {featured && featured.items.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('home.noListings')}</p>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginTop: 0 }}>{t('home.sellTitle')}</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('home.sellSubtitle')}</p>
        <Link to="/sell">
          <button className="btn-primary">{t('home.sellCta')}</button>
        </Link>
      </section>
    </div>
  );
}
