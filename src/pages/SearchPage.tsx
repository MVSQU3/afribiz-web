import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { commonErrorKey, errorCode } from '../lib/errors';
import { BUSINESS_TYPES, COUNTRIES, SECTORS, type SearchResult } from '../lib/types';
import { BusinessCard } from '../components/listings/BusinessCard';
import {
  btnPrimary,
  btnSecondary,
  btnSmall,
  field,
  overline,
  segGroup,
  segOption,
} from '../styles/ui';

/** Filtres portés par l'URL — la recherche est rejouable et partageable. */
const FILTER_KEYS = [
  'q',
  'country',
  'city',
  'sector',
  'businessType',
  'minPrice',
  'maxPrice',
  'minRevenue',
  'maxRevenue',
  'minProfit',
  'maxProfit',
  'sort',
  'page',
] as const;

/** Critères mémorisables dans une alerte — ni le tri ni la page. */
const ALERT_TEXT_KEYS = ['q', 'country', 'city', 'sector', 'businessType'] as const;
const ALERT_NUMBER_KEYS = [
  'minPrice',
  'maxPrice',
  'minRevenue',
  'maxRevenue',
  'minProfit',
  'maxProfit',
] as const;

/** Doit rester aligné sur l'enum BusinessSort de l'API. */
const SORTS = ['recent', 'price_asc', 'price_desc', 'yield'] as const;

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [alertError, setAlertError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const navigate = useNavigate();

  const get = (k: string) => params.get(k) ?? '';

  // Le champ est piloté localement puis poussé dans l'URL à la validation :
  // taper ne doit pas déclencher une requête à chaque frappe.
  const urlQuery = get('q');
  const [queryDraft, setQueryDraft] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  // Resynchronisation quand l'URL change sous nos pieds (arrivée depuis la
  // home, retour navigateur, réinitialisation). Ajustement d'état pendant le
  // rendu — le motif recommandé par React, préférable à un effet.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQueryDraft(urlQuery);
  }

  // Changer de filtres redonne la possibilité de créer une alerte : la
  // confirmation ne vaut que pour la recherche qui vient d'être enregistrée.
  const paramsKey = params.toString();
  const [syncedParams, setSyncedParams] = useState(paramsKey);
  if (paramsKey !== syncedParams) {
    setSyncedParams(paramsKey);
    setAlertState('idle');
    setAlertError(null);
  }

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string> = {};
      for (const k of FILTER_KEYS) {
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

  // Villes proposées, restreintes au pays sélectionné le cas échéant.
  const selectedCountry = get('country');
  useEffect(() => {
    let cancelled = false;
    void api
      .get<string[]>('/businesses/cities', {
        params: selectedCountry ? { country: selectedCountry } : {},
      })
      .then(({ data }) => {
        if (!cancelled) setCities(data);
      })
      .catch(() => {
        // Sans liste, le filtre ville disparaît simplement.
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // Changer un filtre renvoie en page 1 — mais pas quand on change de page.
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  /**
   * Couple de bornes min/max. `allowNegative` sert au bénéfice : filtrer les
   * activités déficitaires est un usage légitime, la borne ne peut pas être
   * bornée à zéro comme pour un prix ou un chiffre d'affaires.
   */
  const range = (
    labelKey: string,
    minKey: string,
    maxKey: string,
    allowNegative = false,
  ) => (
    <>
      <p style={{ ...overline, marginBottom: 8 }}>{t(labelKey)}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
        <input
          style={{ ...field, marginBottom: 0 }}
          type="number"
          min={allowNegative ? undefined : 0}
          placeholder={t('search.min')}
          value={get(minKey)}
          onChange={(e) => setFilter(minKey, e.target.value)}
        />
        <input
          style={{ ...field, marginBottom: 0 }}
          type="number"
          min={allowNegative ? undefined : 0}
          placeholder={t('search.max')}
          value={get(maxKey)}
          onChange={(e) => setFilter(maxKey, e.target.value)}
        />
      </div>
    </>
  );

  /** Bascule une valeur : recliquer sur l'option active la retire. */
  const toggleFilter = (key: string, value: string) =>
    setFilter(key, get(key) === value ? '' : value);

  const resetAll = () => setParams(new URLSearchParams(), { replace: true });

  /**
   * Enregistre la recherche courante comme alerte.
   *
   * Les critères repris sont exactement ceux qui filtrent : ni `sort` ni `page`,
   * qui ne changent pas *quelles* annonces correspondent, seulement leur ordre.
   */
  const createAlert = async () => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setAlertError(null);
    setAlertState('saving');

    const criteria: Record<string, string | number> = {};
    for (const key of ALERT_TEXT_KEYS) {
      const value = get(key);
      if (value) criteria[key] = value;
    }
    for (const key of ALERT_NUMBER_KEYS) {
      const value = get(key);
      // `!== ''` et non truthy : une borne à 0 est un critère valide.
      if (value !== '') criteria[key] = Number(value);
    }

    try {
      await api.post('/saved-searches', { label: alertLabel(), criteria });
      setAlertState('saved');
    } catch (err) {
      setAlertState('idle');
      setAlertError(
        commonErrorKey(err) ??
          (errorCode(err) === 'TOO_MANY_SAVED_SEARCHES'
            ? 'search.tooManyAlerts'
            : 'common.error'),
      );
    }
  };

  /** Intitulé lisible dérivé des filtres — l'acheteur le reconnaîtra dans sa liste. */
  const alertLabel = (): string => {
    const parts = [
      get('q'),
      get('sector') ? t(`sectors.${get('sector')}`) : '',
      get('city'),
      get('country') ? t(`countries.${get('country')}`) : '',
      get('businessType') ? t(`businessTypes.${get('businessType')}`) : '',
    ].filter(Boolean);
    return (parts.join(' · ') || t('search.allListings')).slice(0, 80);
  };

  // Puces récapitulatives des filtres actifs, dans l'ordre de l'écran 02
  const activeChips = (['country', 'city', 'sector', 'businessType'] as const)
    .filter((k) => get(k))
    .map((k) => ({
      key: k,
      label:
        k === 'country'
          ? t(`countries.${get(k)}`)
          : k === 'city'
            ? get(k)
            : k === 'sector'
              ? t(`sectors.${get(k)}`)
              : t(`businessTypes.${get(k)}`),
    }));

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4) 0' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('nav.search')}</h1>
      </div>

      {/* Recherche plein texte + accès aux filtres */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilter('q', queryDraft.trim());
        }}
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <input
          type="search"
          enterKeyHint="search"
          value={queryDraft}
          onChange={(e) => setQueryDraft(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
          aria-label={t('home.searchPlaceholder')}
          maxLength={120}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '8px 10px',
            fontFamily: 'inherit',
            fontSize: 'var(--text-sm)',
            background: 'var(--color-surface)',
            border: '2px solid var(--color-divider)',
            borderRadius: 0,
          }}
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          style={{
            flex: 'none',
            padding: '8px 12px',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: '2px solid var(--color-divider)',
            background: showFilters ? 'var(--color-text)' : 'transparent',
            color: showFilters ? 'var(--color-highlight)' : 'var(--color-text)',
          }}
        >
          {t('search.filters')}
        </button>
      </form>

      {activeChips.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '2px solid var(--color-divider)',
          }}
        >
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key, '')}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                border: 0,
                background: 'var(--color-text)',
                color: 'var(--color-highlight)',
              }}
            >
              {chip.label} ×
            </button>
          ))}
          <button
            onClick={resetAll}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              border: 0,
              background: 'transparent',
              color: 'var(--color-accent-700)',
            }}
          >
            {t('search.reset')}
          </button>
        </div>
      )}

      {/* Panneau de filtres — écran 03 */}
      {showFilters && (
        <div style={{ padding: 'var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
          <p style={{ ...overline, marginBottom: 8 }}>{t('search.country')}</p>
          <div style={segGroup}>
            {COUNTRIES.map((c, i) => (
              <button
                key={c}
                onClick={() => toggleFilter('country', c)}
                style={segOption(get('country') === c, i === 0)}
              >
                {c}
              </button>
            ))}
          </div>

          <p style={{ ...overline, marginBottom: 8 }}>{t('search.sector')}</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginBottom: 'var(--space-4)',
            }}
          >
            {SECTORS.map((s) => {
              const active = get('sector') === s;
              return (
                <button
                  key={s}
                  onClick={() => toggleFilter('sector', s)}
                  style={{
                    padding: '8px 6px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    border: `1px solid ${active ? 'var(--color-divider)' : 'var(--color-rule)'}`,
                    background: active ? 'var(--color-text)' : 'transparent',
                    color: active ? 'var(--color-highlight)' : 'var(--color-text)',
                  }}
                >
                  {t(`sectors.${s}`)}
                </button>
              );
            })}
          </div>

          {/* La ville est saisie librement par les vendeurs : on propose la
              liste réellement présente au catalogue plutôt qu'un champ libre. */}
          {cities.length > 0 && (
            <>
              <p style={{ ...overline, marginBottom: 8 }}>{t('search.city')}</p>
              <select
                style={field}
                value={get('city')}
                onChange={(e) => setFilter('city', e.target.value)}
              >
                <option value="">{t('search.all')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}

          {range('search.priceRange', 'minPrice', 'maxPrice')}
          {range('search.revenueRange', 'minRevenue', 'maxRevenue')}
          {range('search.profitRange', 'minProfit', 'maxProfit', true)}

          <p style={{ ...overline, marginBottom: 8 }}>{t('search.businessType')}</p>
          <div style={segGroup}>
            {BUSINESS_TYPES.map((bt, i) => (
              <button
                key={bt}
                onClick={() => toggleFilter('businessType', bt)}
                style={segOption(get('businessType') === bt, i === 0)}
              >
                {t(`businessTypes.${bt}`)}
              </button>
            ))}
          </div>

          <p style={{ ...overline, marginBottom: 8 }}>{t('search.sortBy')}</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6,
              marginBottom: 'var(--space-4)',
            }}
          >
            {SORTS.map((s) => {
              const active = (get('sort') || 'recent') === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter('sort', s === 'recent' ? '' : s)}
                  style={{
                    padding: '8px 6px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    border: `1px solid ${active ? 'var(--color-divider)' : 'var(--color-rule)'}`,
                    background: active ? 'var(--color-text)' : 'transparent',
                    color: active ? 'var(--color-highlight)' : 'var(--color-text)',
                  }}
                >
                  {t(`search.sort.${s}`)}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetAll} style={btnSecondary}>
              {t('search.reset')}
            </button>
            <button onClick={() => setShowFilters(false)} style={{ ...btnPrimary, flex: 1 }}>
              {t('search.apply')}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4) 0',
          }}
        >
          <p style={{ ...overline, margin: 0 }}>{t('search.results', { count: result.total })}</p>
          <button
            onClick={() => void createAlert()}
            disabled={alertState === 'saving' || alertState === 'saved'}
            style={{
              ...btnSmall,
              flex: 'none',
              background: alertState === 'saved' ? 'var(--color-highlight)' : 'transparent',
            }}
          >
            {alertState === 'saved'
              ? t('search.alertCreated')
              : alertState === 'saving'
                ? t('common.loading')
                : t('search.createAlert')}
          </button>
        </div>
      )}

      {alertError && (
        <p
          style={{
            padding: '0 var(--space-4)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-danger)',
          }}
        >
          {t(alertError)}
        </p>
      )}

      <div style={{ display: 'grid', padding: '0 var(--space-4)' }}>
        {loading && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)', paddingTop: 'var(--space-3)' }}>
            {t('common.loading')}
          </p>
        )}
        {!loading && result?.items.map((b) => <BusinessCard key={b.id} business={b} />)}
        {!loading && result?.items.length === 0 && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)', paddingTop: 'var(--space-3)' }}>
            {t('search.noResults')}
          </p>
        )}
      </div>

      {result && result.pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            padding: 'var(--space-6) var(--space-4)',
          }}
        >
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilter('page', String(p))}
              style={{
                minWidth: 34,
                padding: '7px 10px',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                border: '1px solid var(--color-divider)',
                background: p === result.page ? 'var(--color-text)' : 'transparent',
                color: p === result.page ? 'var(--color-highlight)' : 'var(--color-text)',
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
