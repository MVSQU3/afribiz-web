import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Business, formatPrice, primaryImage } from '../../lib/types';

export function BusinessCard({ business }: { business: Business }) {
  const { t, i18n } = useTranslation();
  const img = primaryImage(business);

  return (
    <Link to={`/businesses/${business.id}`} className="card" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: 'var(--radius-md)',
          background: img ? `url(${img}) center/cover` : 'var(--color-primary-light)',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 4, flexWrap: 'wrap' }}>
          {business.isPremium && <span className="badge badge-featured">{t('listing.featured')}</span>}
          {business.isPremium && <span className="badge badge-verified">✓ {t('listing.verified')}</span>}
        </div>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {business.title}
        </h3>
        <p style={{ margin: '2px 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {business.city}, {t(`countries.${business.country}`)}
        </p>
        <p style={{ margin: '4px 0', fontWeight: 700, color: 'var(--color-primary)' }}>
          {formatPrice(business.askingPrice, business.country, i18n.language)}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {t(`sectors.${business.sector}`)} · {business.employees} {t('listing.employeesShort')}
        </p>
      </div>
    </Link>
  );
}
