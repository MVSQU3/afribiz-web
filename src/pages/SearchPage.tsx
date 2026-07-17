import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { BUSINESS_TYPES, COUNTRIES, SECTORS, type SearchResult } from '../lib/types';
import { BusinessCard } from '../components/listings/BusinessCard';
import { field, label } from '../components/auth/AuthForm.css';

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const get = (k: string) => params.get(k) ?? '';

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = {};
      for (const k of ['country', 'sector', 'businessType', 'minPrice', 'maxPrice', 'page']) {
        const v = params.get(k);
        if (v) query[k] = v;
      }
      const { data } = await api.get<SearchResult>('/businesses', { params: query });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void search();
  }, [search]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 0 }}>{t('nav.search')}</h1>
          {result && (
            <p style={{ margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              {t('search.results', { count: result.total })}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            border: '1px solid var(--color-border)',
            background: showFilters ? 'var(--color-primary-light)' : 'var(--color-surface)',
            color: showFilters ? 'var(--color-primary)' : 'inherit',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
          }}
        >
          ⚙ {t('search.filters')}
        </button>
      </div>

      {showFilters && (
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <label style={label}>{t('search.country')}</label>
          <select style={field} value={get('country')} onChange={(e) => setFilter('country', e.target.value)}>
            <option value="">{t('search.all')}</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{t(`countries.${c}`)}</option>)}
          </select>
          <label style={label}>{t('search.sector')}</label>
          <select style={field} value={get('sector')} onChange={(e) => setFilter('sector', e.target.value)}>
            <option value="">{t('search.all')}</option>
            {SECTORS.map((s) => <option key={s} value={s}>{t(`sectors.${s}`)}</option>)}
          </select>
          <label style={label}>{t('search.businessType')}</label>
          <select style={field} value={get('businessType')} onChange={(e) => setFilter('businessType', e.target.value)}>
            <option value="">{t('search.all')}</option>
            {BUSINESS_TYPES.map((bt) => <option key={bt} value={bt}>{t(`businessTypes.${bt}`)}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1 }}>
              <label style={label}>{t('search.minPrice')}</label>
              <input style={field} type="number" min={0} value={get('minPrice')} onChange={(e) => setFilter('minPrice', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>{t('search.maxPrice')}</label>
              <input style={field} type="number" min={0} value={get('maxPrice')} onChange={(e) => setFilter('maxPrice', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {loading && <p style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</p>}
        {!loading && result?.items.map((b) => <BusinessCard key={b.id} business={b} />)}
        {!loading && result?.items.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('search.noResults')}</p>
        )}
      </div>

      {result && result.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilter('page', String(p))}
              style={{
                border: '1px solid var(--color-border)',
                background: p === result.page ? 'var(--color-primary)' : 'var(--color-surface)',
                color: p === result.page ? '#fff' : 'inherit',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
