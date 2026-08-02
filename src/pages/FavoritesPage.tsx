import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business } from '../lib/types';
import { BusinessCard } from '../components/listings/BusinessCard';
import { useFavoritesStore } from '../stores/favorites.store';
import { btnSmall, overlineStrong } from '../styles/ui';

interface SavedSearch {
  id: string;
  label: string;
  criteria: Record<string, string | number | undefined>;
  isActive: boolean;
  createdAt: string;
}

/** Reconstruit l'URL de recherche à partir des critères mémorisés. */
function criteriaToSearch(criteria: SavedSearch['criteria']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(criteria ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

export function FavoritesPage() {
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);
  const favoriteIds = useFavoritesStore((s) => s.ids);

  const load = useCallback(async () => {
    const [favorites, alerts] = await Promise.all([
      api.get<Business[]>('/favorites'),
      api.get<SavedSearch[]>('/saved-searches'),
    ]);
    setBusinesses(favorites.data);
    setSearches(alerts.data);
  }, []);

  useEffect(() => {
    // Le chargement est déclenché dans une continuation plutôt qu'en corps
    // d'effet : la mise à jour d'état n'a lieu qu'une fois la réponse reçue.
    let cancelled = false;
    void Promise.all([
      api.get<Business[]>('/favorites'),
      api.get<SavedSearch[]>('/saved-searches'),
    ]).then(([favorites, alerts]) => {
      if (cancelled) return;
      setBusinesses(favorites.data);
      setSearches(alerts.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Le retrait d'un favori doit vider la ligne de cette page, pas seulement
  // décocher le bouton : on suit l'état global plutôt que la réponse initiale.
  const visible = businesses?.filter((b) => favoriteIds.has(b.id)) ?? null;

  const removeAlert = async (id: string) => {
    await api.delete(`/saved-searches/${id}`);
    await load();
  };

  const toggleAlert = async (alert: SavedSearch) => {
    await api.post(`/saved-searches/${alert.id}/${alert.isActive ? 'pause' : 'resume'}`);
    await load();
  };

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('favorites.title')}</h1>
      </div>

      {/* Annonces mises de côté */}
      <section style={{ padding: 'var(--space-4)' }}>
        <p style={{ ...overlineStrong, marginBottom: 0 }}>{t('favorites.listings')}</p>

        {visible === null && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
            {t('common.loading')}
          </p>
        )}
        {visible?.length === 0 && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)', paddingTop: 'var(--space-3)' }}>
            {t('favorites.empty')}
          </p>
        )}
        {visible?.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </section>

      {/* Alertes */}
      <section
        style={{
          padding: 'var(--space-4)',
          borderTop: '2px solid var(--color-divider)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 'var(--space-2)',
          }}
        >
          <p style={{ ...overlineStrong, marginBottom: 0 }}>{t('favorites.alerts')}</p>
          <Link to="/search" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent-700)' }}>
            {t('favorites.createFromSearch')}
          </Link>
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)', marginTop: 'var(--space-2)' }}>
          {t('favorites.alertsHint')}
        </p>

        {searches?.length === 0 && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
            {t('favorites.noAlerts')}
          </p>
        )}

        {searches?.map((alert) => (
          <div key={alert.id} style={{ padding: 'var(--space-3) 0', borderTop: '1px solid var(--color-rule)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>{alert.label}</p>
              <span
                className="badge"
                style={
                  alert.isActive
                    ? { background: 'var(--color-accent)', color: 'var(--color-bg)' }
                    : { border: '1px solid var(--color-rule)', color: 'var(--color-neutral-700)' }
                }
              >
                {alert.isActive ? t('favorites.active') : t('favorites.paused')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link to={criteriaToSearch(alert.criteria)} style={btnSmall}>
                {t('favorites.viewResults')}
              </Link>
              <button style={btnSmall} onClick={() => void toggleAlert(alert)}>
                {alert.isActive ? t('favorites.pause') : t('favorites.resume')}
              </button>
              <button
                style={{ ...btnSmall, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => void removeAlert(alert.id)}
              >
                {t('favorites.delete')}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
