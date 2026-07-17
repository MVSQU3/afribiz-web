import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { type Business, formatPrice } from '../lib/types';
import { useAuthStore } from '../stores/auth.store';

export function ListingDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    void api
      .get<Business>(`/businesses/${id}`)
      .then(({ data }) => setBusiness(data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p>{t('listing.notFound')}</p>;
  if (!business) return <p style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</p>;

  const images = [...(business.images ?? [])].sort((a, b) => a.position - b.position);
  const big = (url: string) => url.replace('/upload/', '/upload/w_1200,f_auto/');
  const thumb = (url: string) => url.replace('/upload/', '/upload/w_200,h_140,c_fill,f_auto/');

  const onContact = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/businesses/${business.id}` } } });
      return;
    }
    navigate(`/messages?business=${business.id}`); // Messagerie — épic 4
  };

  const financial = (labelKey: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{t(labelKey)}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 96 }}>
      {images.length > 0 && (
        <div>
          <img
            src={big(images[activeImg].url)}
            loading="lazy"
            alt={business.title}
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', aspectRatio: '3/2', objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img
                  key={img.id}
                  src={thumb(img.url)}
                  loading="lazy"
                  alt=""
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 80,
                    height: 56,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    outline: i === activeImg ? '2px solid var(--color-primary)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        {business.isPremium && <span className="badge badge-featured">{t('listing.featured')}</span>}
        {business.isPremium && <span className="badge badge-verified">✓ {t('listing.verified')}</span>}
        <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
          {t(`sectors.${business.sector}`)}
        </span>
        <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
          {t(`businessTypes.${business.businessType}`)}
        </span>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>{business.title}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 0 }}>
        {business.city}, {t(`countries.${business.country}`)}
      </p>
      <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
        {formatPrice(business.askingPrice, business.country, i18n.language)}
      </p>

      <div className="card" style={{ padding: 'var(--space-4)', margin: 'var(--space-4) 0' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginTop: 0 }}>{t('listing.financials')}</h2>
        {financial('listing.revenue', formatPrice(business.annualRevenue, business.country, i18n.language))}
        {financial('listing.profit', formatPrice(business.netProfit, business.country, i18n.language))}
        {financial('listing.employees', String(business.employees))}
        {financial('listing.founded', String(business.foundedYear))}
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)' }}>{t('listing.about')}</h2>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{business.description}</p>

      <h2 style={{ fontSize: 'var(--text-lg)' }}>{t('listing.reasonForSale')}</h2>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{business.reasonForSale}</p>

      {business.seller && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {t('listing.soldBy')} {business.seller.firstName}
          {business.seller.isVerified && ' ✓'}
        </p>
      )}

      <div
        style={{
          // Bouton flottant : toujours visible, le contenu scrolle derrière
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + var(--space-3))',
          left: 'var(--space-4)',
          right: 'var(--space-4)',
          maxWidth: 720,
          margin: '0 auto',
          zIndex: 5,
        }}
      >
        <button className="btn-primary" style={{ width: '100%', boxShadow: 'var(--shadow-nav)' }} onClick={onContact}>
          {t('listing.contactSeller')}
        </button>
      </div>
    </div>
  );
}
