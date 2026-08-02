import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { SECTORS, type Sector, type SearchResult } from '../lib/types';
import { BusinessCard } from '../components/listings/BusinessCard';
import { btnDark, overlineStrong } from '../styles/ui';

// Raccourcis de la barre d'onglets : « tous » plus les trois premiers secteurs
const QUICK_SECTORS: readonly Sector[] = SECTORS.slice(0, 3);

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState<SearchResult | null>(null);

  useEffect(() => {
    void api
      .get<SearchResult>('/businesses', { params: { limit: 6 } })
      .then(({ data }) => setFeatured(data));
  }, []);

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      {/* Hero : titre serré, sous-titre, recherche à filet 2px */}
      <section
        style={{
          padding: 'var(--space-5) var(--space-4) var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <h1 style={{ fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 6 }}>
          {t('home.title')}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginBottom: 14 }}>
          {t('home.subtitle')}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
          }}
          style={{ display: 'flex', border: '2px solid var(--color-divider)' }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-surface)',
              border: 0,
              borderRadius: 0,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 14px',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              border: 0,
            }}
          >
            {t('home.searchCta')}
          </button>
        </form>
      </section>

      {/* Onglets de secteur : filtres réels, pas décoratifs */}
      <nav style={{ display: 'flex', borderBottom: '2px solid var(--color-divider)' }}>
        <Link
          to="/search"
          style={{
            flex: 1,
            padding: '9px 10px',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'var(--color-text)',
            color: 'var(--color-highlight)',
          }}
        >
          {t('search.all')}
        </Link>
        {QUICK_SECTORS.map((s) => (
          <Link
            key={s}
            to={`/search?sector=${s}`}
            style={{
              flex: 1,
              padding: '9px 10px',
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderLeft: '1px solid var(--color-rule)',
            }}
          >
            {t(`sectors.${s}`)}
          </Link>
        ))}
      </nav>

      <section style={{ padding: '0 var(--space-4)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: 'var(--space-4) 0 var(--space-2)',
          }}
        >
          <h2 style={{ ...overlineStrong, fontSize: 'var(--text-sm)', margin: 0 }}>
            {t('home.featured')}
          </h2>
          <Link
            to="/search"
            style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent-700)' }}
          >
            {t('common.seeAll')}
          </Link>
        </div>
        <div style={{ display: 'grid' }}>
          {featured?.items.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
          {featured && featured.items.length === 0 && (
            <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
              {t('home.noListings')}
            </p>
          )}
        </div>
      </section>

      {/* Bloc d'appel vendeur : champ lime plat, encadré 2px */}
      <section
        style={{
          margin: 'var(--space-4)',
          border: '2px solid var(--color-divider)',
          background: 'var(--color-highlight)',
          padding: 'var(--space-4)',
        }}
      >
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 4 }}>{t('home.sellTitle')}</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-700)', marginBottom: 'var(--space-3)' }}>
          {t('home.sellSubtitle')}
        </p>
        <Link to="/sell" style={{ ...btnDark, display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
          {t('home.sellCta')}
        </Link>
      </section>
    </div>
  );
}
