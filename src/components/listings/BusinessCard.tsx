import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Business, formatPrice, primaryImage } from '../../lib/types';
import { formatMultiple, profitMultiple } from '../../lib/valuation';
import { thumb } from '../../styles/ui';
import { FavoriteButton } from './FavoriteButton';

/**
 * Ligne de résultat (écrans 01 et 02) : vignette en noir et blanc à gauche,
 * bloc de texte à droite, filet fin en haut. Aucune ombre, aucun arrondi —
 * les lignes s'empilent et le filet suffit à les séparer.
 */
export function BusinessCard({ business }: { business: Business }) {
  const { t, i18n } = useTranslation();
  const img = primaryImage(business);
  const multiple = profitMultiple(business);

  return (
    <Link
      to={`/businesses/${business.id}`}
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) 0',
        borderTop: '1px solid var(--color-rule)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={thumb(img, 104, 78)} />
      <div style={{ minWidth: 0, flex: 1 }}>
        {business.isPremium && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 5, flexWrap: 'wrap' }}>
            <span className="badge badge-featured">{t('listing.featured')}</span>
          </div>
        )}
        <p
          style={{
            margin: '0 0 3px',
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {business.title}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
          {business.city}, {t(`countries.${business.country}`)} · {business.employees}{' '}
          {t('listing.employeesShort')} · {business.foundedYear}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              color: 'var(--color-accent-700)',
            }}
          >
            {formatPrice(business.askingPrice, business.country, i18n.language)}
          </p>
          {/* Le multiple est le vrai repère de comparaison entre deux annonces */}
          {multiple !== null && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                background: 'var(--color-highlight)',
                color: 'var(--color-accent-900)',
              }}
              title={t('listing.multipleHint')}
            >
              {t('listing.multipleShort', { multiple: formatMultiple(multiple, i18n.language) })}
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <FavoriteButton businessId={business.id} />
          </span>
        </div>
      </div>
    </Link>
  );
}
