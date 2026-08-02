import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { commonErrorKey } from '../lib/errors';
import { copyToClipboard } from '../lib/clipboard';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { type Business, formatPrice } from '../lib/types';
import {
  formatMultiple,
  formatPercent,
  isLossMaking,
  netMargin,
  paybackYears,
  profitMultiple,
} from '../lib/valuation';
import { useAuthStore } from '../stores/auth.store';
import { FavoriteButton } from '../components/listings/FavoriteButton';
import {
  avatar,
  btnPrimary,
  btnSecondary,
  errorBox,
  field,
  initials,
  overlineStrong,
  successBox,
} from '../styles/ui';

export function ListingDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reportErrorKey, setReportErrorKey] = useState('common.error');
  const [shared, setShared] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Onglet du navigateur et référencement Google. Les aperçus WhatsApp et
  // Facebook, eux, sont rendus par l'API — ces robots ignorent le JavaScript.
  useDocumentMeta(
    business ? `${business.title} · ${business.city} — ${t('app.name')}` : null,
    business?.description,
  );

  useEffect(() => {
    void api
      .get<Business>(`/businesses/${id}`)
      .then(({ data }) => setBusiness(data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p>{t('listing.notFound')}</p>;
  if (!business) return <p style={{ color: 'var(--color-neutral-700)' }}>{t('common.loading')}</p>;

  const multiple = profitMultiple(business);
  const margin = netMargin(business);
  const payback = multiple === null ? null : paybackYears(multiple);

  const images = [...(business.images ?? [])].sort((a, b) => a.position - b.position);
  const big = (url: string) => url.replace('/upload/', '/upload/w_1200,f_auto/');
  const thumbUrl = (url: string) => url.replace('/upload/', '/upload/w_200,h_140,c_fill,f_auto/');

  const onContact = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/businesses/${business.id}` } } });
      return;
    }
    navigate(`/messages?business=${business.id}`);
  };

  /**
   * Partage natif sur mobile (feuille de partage du système, où WhatsApp est
   * en première position), copie du lien ailleurs. `navigator.share` exige un
   * contexte sécurisé : en HTTP local il est absent, d'où le repli.
   */
  const onShare = async () => {
    const url = `${window.location.origin}/businesses/${business.id}`;
    const title = `${business.title} · ${business.city}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // Partage annulé par l'utilisateur : ne rien signaler.
        return;
      }
    }

    if (await copyToClipboard(url)) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } else {
      // Dernier recours : on affiche le lien, à l'utilisateur de le copier.
      setShareUrl(url);
    }
  };

  /** Signalement : POST /businesses/:id/report, réservé aux comptes connectés. */
  const onReport = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/businesses/${business.id}` } } });
      return;
    }
    if (!reportReason.trim()) return;
    setReportState('sending');
    try {
      await api.post(`/businesses/${business.id}/report`, { reason: reportReason.trim() });
      setReportState('sent');
      setReportReason('');
    } catch (err) {
      setReportErrorKey(commonErrorKey(err) ?? 'common.error');
      setReportState('error');
    }
  };

  /** Cellule de la grille « chiffres clés » — deux colonnes à filets. */
  const stat = (labelKey: string, value: string, rightBorder: boolean, topBorder: boolean) => (
    <div
      style={{
        padding: '10px var(--space-4)',
        borderRight: rightBorder ? '1px solid var(--color-rule)' : undefined,
        borderTop: topBorder ? '1px solid var(--color-rule)' : undefined,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-neutral-700)',
        }}
      >
        {t(labelKey)}
      </p>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{value}</p>
    </div>
  );

  const section = (titleKey: string, body: string) => (
    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
      <p style={{ ...overlineStrong, marginBottom: 6 }}>{t(titleKey)}</p>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          lineHeight: 1.5,
          color: 'var(--color-neutral-800)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {body}
      </p>
    </div>
  );

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)', paddingBottom: 76 }}>
      {/* Retour et partage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px var(--space-4)',
            border: 0,
            background: 'transparent',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          ← {t('common.back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FavoriteButton businessId={business.id} size="large" />
          <button
            onClick={() => void onShare()}
            style={{
              padding: '10px var(--space-4)',
              border: 0,
              background: shared ? 'var(--color-highlight)' : 'transparent',
              color: 'var(--color-accent-700)',
              fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
          >
            {shared ? t('listing.linkCopied') : t('listing.share')}
          </button>
        </div>
      </div>

      {/* Ni partage natif ni presse-papiers : on montre le lien à copier */}
      {shareUrl && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '2px solid var(--color-divider)',
            background: 'var(--color-surface)',
          }}
        >
          <p style={{ ...overlineStrong, marginBottom: 5 }}>{t('listing.copyManually')}</p>
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            style={{ ...field, marginBottom: 0, fontSize: 12 }}
          />
        </div>
      )}

      {/* Photo principale, en noir et blanc, plus le compteur */}
      {images.length > 0 ? (
        <div style={{ borderBottom: '2px solid var(--color-divider)' }}>
          <img
            src={big(images[activeImg].url)}
            loading="lazy"
            alt={business.title}
            className="grayscale"
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 4, padding: 4, overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img
                  key={img.id}
                  src={thumbUrl(img.url)}
                  loading="lazy"
                  alt=""
                  onClick={() => setActiveImg(i)}
                  className="grayscale"
                  style={{
                    width: 72,
                    height: 52,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    flex: 'none',
                    border: i === activeImg ? '2px solid var(--color-accent)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            height: 150,
            borderBottom: '2px solid var(--color-divider)',
            display: 'grid',
            placeItems: 'center',
            background:
              'repeating-linear-gradient(135deg, var(--color-neutral-300) 0 8px, var(--color-surface) 8px 16px)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--color-neutral-700)' }}>
            {t('listing.noPhoto')}
          </span>
        </div>
      )}

      {/* Titre, localisation, prix */}
      <div style={{ padding: 'var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {business.seller?.isVerified && <span className="badge badge-verified">{t('listing.verified')}</span>}
          {business.isPremium && <span className="badge badge-featured">{t('listing.featured')}</span>}
        </div>
        <h1 style={{ fontSize: 25, letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: 6 }}>
          {business.title}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-700)' }}>
          {business.city}, {t(`countries.${business.country}`)} · {t(`sectors.${business.sector}`)} ·{' '}
          {t(`businessTypes.${business.businessType}`)}
        </p>
        <p style={{ ...overlineStrong, fontWeight: 600, marginTop: 14 }}>{t('listing.askingPrice')}</p>
        <p
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-accent-700)',
          }}
        >
          {formatPrice(business.askingPrice, business.country, i18n.language)}
        </p>
      </div>

      {/* Chiffres clés — grille 2×3 à filets */}
      <div style={{ borderBottom: '2px solid var(--color-divider)' }}>
        <p style={{ ...overlineStrong, padding: '10px var(--space-4) 8px', marginBottom: 0 }}>
          {t('listing.financials')}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderTop: '1px solid var(--color-rule)',
          }}
        >
          {stat('listing.revenue', formatPrice(business.annualRevenue, business.country, i18n.language), true, false)}
          {stat('listing.profit', formatPrice(business.netProfit, business.country, i18n.language), false, false)}
          {stat('listing.employees', String(business.employees), true, true)}
          {stat('listing.founded', String(business.foundedYear), false, true)}
          {stat(
            'listing.margin',
            margin === null ? '—' : formatPercent(margin, i18n.language),
            true,
            true,
          )}
          {stat(
            'listing.multiple',
            multiple === null ? '—' : formatMultiple(multiple, i18n.language),
            false,
            true,
          )}
        </div>
      </div>

      {/* Lecture du multiple — le chiffre seul ne parle qu'aux initiés */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '2px solid var(--color-divider)',
          background: multiple === null ? 'var(--color-surface)' : 'var(--color-highlight)',
        }}
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.45 }}>
          {multiple === null
            ? isLossMaking(business)
              ? t('listing.valuationLoss')
              : t('listing.valuationUnavailable')
            : payback === 0
              ? t('listing.valuationUnderYear', {
                  multiple: formatMultiple(multiple, i18n.language),
                })
              : t('listing.valuationExplained', {
                  multiple: formatMultiple(multiple, i18n.language),
                  count: payback,
                })}
        </p>
      </div>

      {section('listing.about', business.description)}
      {section('listing.reasonForSale', business.reasonForSale)}

      {business.seller && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={avatar(38)}>{initials(business.seller.firstName)}</div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-700)',
              }}
            >
              {t('listing.soldBy')}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>
              {business.seller.firstName}
              {business.seller.isVerified && ` · ${t('listing.verified').toLowerCase()}`}
            </p>
          </div>
        </div>
      )}

      {/* Barre d'action fixe, au-dessus du bottom nav */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--bottom-nav-height)',
          left: 0,
          right: 0,
          zIndex: 5,
          display: 'flex',
          gap: 8,
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-bg)',
          borderTop: '2px solid var(--color-divider)',
        }}
      >
        <button style={btnSecondary} onClick={() => setReporting(true)}>
          {t('listing.report')}
        </button>
        <button style={{ ...btnPrimary, flex: 1 }} onClick={onContact}>
          {t('listing.contactSeller')}
        </button>
      </div>

      {/* Dialogue de signalement */}
      {reporting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--space-4)',
            background: 'color-mix(in srgb, var(--color-neutral-900) 50%, transparent)',
          }}
        >
          <div
            style={{
              width: 'min(440px, 100%)',
              background: 'var(--color-bg)',
              border: '2px solid var(--color-divider)',
              padding: 'var(--space-4)',
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>{t('listing.report')}</h2>
            {reportState === 'error' && <div style={errorBox}>{t(reportErrorKey)}</div>}
            {reportState === 'sent' ? (
              <div style={successBox}>{t('listing.reportSent')}</div>
            ) : (
              <>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>
                  {t('listing.reportHint')}
                </p>
                <textarea
                  style={{ ...field, minHeight: 90, resize: 'vertical' }}
                  value={reportReason}
                  maxLength={1000}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                style={btnSecondary}
                onClick={() => {
                  setReporting(false);
                  setReportState('idle');
                }}
              >
                {reportState === 'sent' ? t('common.close') : t('admin.cancel')}
              </button>
              {reportState !== 'sent' && (
                <button
                  style={btnPrimary}
                  disabled={reportState === 'sending' || !reportReason.trim()}
                  onClick={() => void onReport()}
                >
                  {reportState === 'sending' ? t('common.loading') : t('listing.reportSubmit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
