import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDirectoryStore } from '../stores/directory.store';
import { DIRECTORY_CATEGORIES, type Directory, type DirectoryCategory } from '../lib/types';
import { btnDark, btnSmall, field, label, noticeBox, overlineStrong } from '../styles/ui';
import { useDocumentMeta } from '../lib/useDocumentMeta';

/**
 * Annuaire éditorial des SaaS africains.
 *
 * Volontairement séparé de `/search` : ces entreprises ne sont pas forcément à
 * céder, et les confondre avec les annonces produirait des demandes de mise en
 * relation impossibles à honorer. D'où l'encadré d'avertissement en tête de
 * page, qui n'est pas décoratif.
 */
export function DirectoryPage() {
  const { t, i18n } = useTranslation();
  const [country, setCountry] = useState<string | null>(null);
  const [category, setCategory] = useState<DirectoryCategory | null>(null);

  const result = useDirectoryStore((s) => s.result);
  const error = useDirectoryStore((s) => s.error);
  const countries = useDirectoryStore((s) => s.countries);
  const categories = useDirectoryStore((s) => s.categories);
  const search = useDirectoryStore((s) => s.search);
  const loadFilters = useDirectoryStore((s) => s.loadFilters);

  useDocumentMeta(t('directory.metaTitle'), t('directory.metaDescription'));

  // React Router ne défile pas jusqu'aux ancres : le lien « proposer un SaaS »
  // de la landing arrive sur /directory#proposer et resterait en haut de page.
  // Le défilement est reporté d'une frame — au montage, le conteneur (le <main>
  // du Layout, en `overflow: auto`) n'a pas encore sa hauteur définitive et
  // `scrollIntoView` ne ferait rien.
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void search({ country, category });
  }, [search, country, category]);

  // Les pays hors des six du marché n'ont pas de libellé traduit : on retombe
  // sur le code ISO plutôt que d'afficher la clé i18n brute.
  const countryLabel = (code: string) =>
    i18n.exists(`countries.${code}`) ? t(`countries.${code}`) : code;

  const entries = result?.items ?? null;

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)' }}>
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{t('directory.title')}</h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-neutral-700)',
            margin: 'var(--space-2) 0 0',
          }}
        >
          {t('directory.subtitle')}
        </p>
      </div>

      <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
        <p style={noticeBox}>{t('directory.notForSale')}</p>
      </div>

      {/* Filtres : pays puis catégorie, chacun avec une option « tout » */}
      <section style={{ padding: 'var(--space-4)' }}>
        {countries.length > 0 && (
          <>
            <p style={{ ...overlineStrong, marginBottom: 'var(--space-2)' }}>
              {t('directory.filterCountry')}
            </p>
            <div
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}
            >
              <FilterChip active={country === null} onClick={() => setCountry(null)}>
                {t('directory.all')}
              </FilterChip>
              {countries.map((code) => (
                <FilterChip
                  key={code}
                  active={country === code}
                  onClick={() => setCountry(country === code ? null : code)}
                >
                  {countryLabel(code)}
                </FilterChip>
              ))}
            </div>
          </>
        )}

        {categories.length > 0 && (
          <>
            <p style={{ ...overlineStrong, marginBottom: 'var(--space-2)' }}>
              {t('directory.filterCategory')}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <FilterChip active={category === null} onClick={() => setCategory(null)}>
                {t('directory.all')}
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(category === c ? null : c)}
                >
                  {t(`directory.categories.${c}`)}
                </FilterChip>
              ))}
            </div>
          </>
        )}
      </section>

      <section style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{t(error)}</p>
        )}

        {!error && entries === null && (
          <p style={{ color: 'var(--color-neutral-700)', fontSize: 'var(--text-sm)' }}>
            {t('common.loading')}
          </p>
        )}

        {entries !== null && (
          <p style={{ ...overlineStrong, marginBottom: 0 }}>
            {t('directory.count', { count: result?.total ?? 0 })}
          </p>
        )}

        {entries?.length === 0 && (
          <p
            style={{
              color: 'var(--color-neutral-700)',
              fontSize: 'var(--text-sm)',
              paddingTop: 'var(--space-3)',
            }}
          >
            {t('directory.empty')}
          </p>
        )}

        {entries?.map((entry) => (
          <DirectoryRow key={entry.id} entry={entry} countryLabel={countryLabel} />
        ))}
      </section>

      <SubmitSection />

      <section style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)', lineHeight: 1.5 }}>
          {t('directory.disclaimer')}
        </p>
      </section>
    </div>
  );
}

/** Une fiche de l'annuaire : nom, catégorie, provenance, description, lien. */
function DirectoryRow({
  entry,
  countryLabel,
}: {
  entry: Directory;
  countryLabel: (code: string) => string;
}) {
  const { t, i18n } = useTranslation();

  return (
    <article style={{ padding: 'var(--space-3) 0', borderTop: '1px solid var(--color-rule)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--space-2)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800 }}>{entry.name}</h2>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {entry.isVerified && (
            <span
              className="badge"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            >
              {t('directory.verified')}
            </span>
          )}
          <span className="badge" style={{ border: '1px solid var(--color-rule)' }}>
            {t(`directory.categories.${entry.category}`)}
          </span>
        </div>
      </div>

      <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
        {[entry.city, countryLabel(entry.country), entry.foundedYear].filter(Boolean).join(' · ')}
      </p>

      <p style={{ margin: '5px 0 var(--space-3)', fontSize: 'var(--text-sm)', lineHeight: 1.45 }}>
        {i18n.language === 'en' ? entry.descriptionEn : entry.descriptionFr}
      </p>

      {/* Lien sortant : `noopener` par sécurité, `nofollow` parce que
          l'annuaire ne doit pas se transformer en ferme de backlinks. */}
      <a href={entry.website} target="_blank" rel="noopener noreferrer nofollow" style={btnSmall}>
        {t('directory.visit')}
      </a>
    </article>
  );
}

/**
 * Espace « proposer un logiciel ».
 *
 * L'API répond 202 : la proposition est enregistrée en attente, pas publiée —
 * le message de confirmation doit le dire, sinon la personne cherchera sa fiche
 * en vain.
 */
function SubmitSection() {
  const { t } = useTranslation();
  const submit = useDirectoryStore((s) => s.submit);
  const status = useDirectoryStore((s) => s.submitStatus);
  const errorKey = useDirectoryStore((s) => s.submitError);
  const resetSubmit = useDirectoryStore((s) => s.resetSubmit);

  const [form, setForm] = useState({
    name: '',
    website: '',
    country: '',
    city: '',
    category: '' as DirectoryCategory | '',
    descriptionFr: '',
    descriptionEn: '',
    submitterEmail: '',
  });

  // Le store survit au démontage : sans remise à zéro, revenir sur la page
  // afficherait la confirmation d'un envoi précédent à la place du formulaire.
  useEffect(() => resetSubmit, [resetSubmit]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit({
      name: form.name,
      website: form.website,
      country: form.country,
      category: form.category,
      descriptionFr: form.descriptionFr,
      descriptionEn: form.descriptionEn,
      // Les champs vides sont omis plutôt qu'envoyés en chaîne vide : le DTO
      // les valide dès qu'ils sont présents, et `''` échouerait sur @IsEmail.
      ...(form.city ? { city: form.city } : {}),
      ...(form.submitterEmail ? { submitterEmail: form.submitterEmail } : {}),
    });
  };

  return (
    <section
      id="proposer"
      style={{
        margin: 'var(--space-4)',
        border: '2px solid var(--color-divider)',
        background: 'var(--color-highlight)',
        padding: 'var(--space-4)',
        scrollMarginTop: 'var(--header-height)',
      }}
    >
      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 4 }}>{t('directory.submit.title')}</h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-accent-700)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {t('directory.submit.subtitle')}
      </p>

      {status === 'sent' ? (
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          {t('directory.submit.sent')}
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          {errorKey && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-danger)',
                fontWeight: 600,
                margin: '0 0 var(--space-3)',
              }}
            >
              {t(errorKey)}
            </p>
          )}

          <label style={label} htmlFor="saas-name">
            {t('directory.submit.fieldName')}
          </label>
          <input
            id="saas-name"
            style={field}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            maxLength={120}
            required
          />

          <label style={label} htmlFor="saas-website">
            {t('directory.submit.fieldUrl')}
          </label>
          <input
            id="saas-website"
            type="url"
            placeholder="https://"
            style={field}
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            required
          />

          <label style={label} htmlFor="saas-country">
            {t('directory.submit.fieldCountry')}
          </label>
          <input
            id="saas-country"
            style={field}
            value={form.country}
            // Le code ISO est normalisé à la saisie : l'API refuse « ci ».
            onChange={(e) => set('country', e.target.value.toUpperCase().slice(0, 2))}
            placeholder={t('directory.submit.countryPlaceholder')}
            pattern="[A-Za-z]{2}"
            required
          />

          <label style={label} htmlFor="saas-city">
            {t('directory.submit.fieldCity')}
          </label>
          <input
            id="saas-city"
            style={field}
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            maxLength={80}
          />

          <label style={label} htmlFor="saas-category">
            {t('directory.submit.fieldCategory')}
          </label>
          <select
            id="saas-category"
            style={field}
            value={form.category}
            onChange={(e) => set('category', e.target.value as DirectoryCategory | '')}
            required
          >
            <option value="">{t('directory.submit.categoryPlaceholder')}</option>
            {DIRECTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`directory.categories.${c}`)}
              </option>
            ))}
          </select>

          {/* Deux descriptions : la page bascule FR/EN sans rechargement et
              l'API exige les deux. */}
          <label style={label} htmlFor="saas-description-fr">
            {t('directory.submit.fieldDescriptionFr')}
          </label>
          <textarea
            id="saas-description-fr"
            rows={2}
            style={{ ...field, resize: 'vertical' }}
            value={form.descriptionFr}
            onChange={(e) => set('descriptionFr', e.target.value)}
            maxLength={300}
            required
          />

          <label style={label} htmlFor="saas-description-en">
            {t('directory.submit.fieldDescriptionEn')}
          </label>
          <textarea
            id="saas-description-en"
            rows={2}
            style={{ ...field, resize: 'vertical' }}
            value={form.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
            maxLength={300}
            required
          />

          <label style={label} htmlFor="saas-email">
            {t('directory.submit.fieldEmail')}
          </label>
          <input
            id="saas-email"
            type="email"
            style={field}
            value={form.submitterEmail}
            onChange={(e) => set('submitterEmail', e.target.value)}
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              ...btnDark,
              display: 'flex',
              width: '100%',
              justifyContent: 'flex-start',
              opacity: status === 'sending' ? 0.5 : 1,
            }}
          >
            {status === 'sending' ? t('common.loading') : t('directory.submit.cta')}
          </button>
        </form>
      )}

      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-accent-700)',
          margin: 'var(--space-3) 0 0',
          lineHeight: 1.5,
        }}
      >
        {t('directory.submit.hint')}
      </p>
    </section>
  );
}

/** Puce de filtre : contraste inversé à l'état actif, comme les onglets. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        ...btnSmall,
        background: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-highlight)' : 'var(--color-text)',
        borderColor: active ? 'var(--color-text)' : 'var(--color-divider)',
      }}
    >
      {children}
    </button>
  );
}
