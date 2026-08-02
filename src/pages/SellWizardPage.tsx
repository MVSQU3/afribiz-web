import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { BUSINESS_TYPES, COUNTRIES, SECTORS, type Business } from '../lib/types';
import { ImageUploader, type BusinessImage } from '../components/listings/ImageUploader';
import { field, label, errorBox } from '../components/auth/AuthForm.css';
import { btnPrimary, btnSecondary, noticeBox, segGroup, segOption } from '../styles/ui';

type Step = 1 | 2 | 3;

const EMPTY = {
  title: '',
  description: '',
  country: 'CI',
  city: '',
  sector: 'commerce',
  businessType: 'physical',
  foundedYear: new Date().getFullYear(),
  employees: 0,
  annualRevenue: 0,
  netProfit: 0,
  askingPrice: 0,
  reasonForSale: '',
};

/** Devise affichée en suffixe des champs monétaires, selon le pays choisi. */
const CURRENCY_LABELS: Record<string, string> = {
  CI: 'FCFA', SN: 'FCFA', BJ: 'FCFA', TG: 'FCFA', NG: 'NGN', GH: 'GHS',
};

export function SellWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const businessId = params.get('id');

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ ...EMPTY });
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Le parcours diffère selon qu'on rédige un brouillon ou qu'on corrige une
  // annonce déjà en ligne : cette dernière ne se « soumet » pas, elle se
  // met à jour et reste visible pendant la revérification.
  const [status, setStatus] = useState<Business['status'] | null>(null);

  // Reprise d'un brouillon existant
  useEffect(() => {
    if (!businessId) return;
    void api.get<Business>(`/businesses/mine/${businessId}`).then(({ data }) => {
      setForm({
        title: data.title,
        description: data.description,
        country: data.country,
        city: data.city,
        sector: data.sector,
        businessType: data.businessType,
        foundedYear: data.foundedYear,
        employees: data.employees,
        annualRevenue: Number(data.annualRevenue),
        netProfit: Number(data.netProfit),
        askingPrice: Number(data.askingPrice),
        reasonForSale: data.reasonForSale,
      });
      setImages(data.images ?? []);
      setStatus(data.status);
    });
  }, [businessId]);

  const isPublished = status === 'published';

  const set =
    (key: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setForm((f) => ({ ...f, [key]: value }));
      };

  /** Sauvegarde le brouillon (create au 1er passage, update ensuite). */
  const saveAndNext = async () => {
    setError(null);
    setSaving(true);
    try {
      if (!businessId) {
        const { data } = await api.post<Business>('/businesses', form);
        setParams({ id: data.id }, { replace: true });
      } else {
        await api.patch(`/businesses/${businessId}`, form);
      }
      setStep((s) => Math.min(3, s + 1) as Step);
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!businessId) return;
    setSaving(true);
    setError(null);
    try {
      // Une annonce en ligne se met simplement à jour ; la revérification est
      // déclenchée côté API, sans la retirer du catalogue.
      if (isPublished) {
        await api.patch(`/businesses/${businessId}`, form);
        navigate('/dashboard?updated=1');
      } else {
        await api.post(`/businesses/${businessId}/submit`);
        navigate('/dashboard?submitted=1');
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const currency = CURRENCY_LABELS[form.country] ?? 'FCFA';

  /** Champ monétaire : saisie à gauche, devise en pavé sombre à droite. */
  const moneyField = (labelKey: string, key: 'annualRevenue' | 'netProfit' | 'askingPrice') => (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <label style={label}>{t(labelKey)}</label>
      <div style={{ display: 'flex', border: '2px solid var(--color-divider)' }}>
        <input
          type="number"
          min={0}
          value={form[key]}
          onChange={set(key)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: 10,
            fontFamily: 'inherit',
            fontSize: 14,
            background: 'var(--color-surface)',
            border: 0,
            borderRadius: 0,
          }}
        />
        <span
          style={{
            padding: '10px 12px',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            background: 'var(--color-text)',
            color: 'var(--color-highlight)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {currency}
        </span>
      </div>
    </div>
  );

  const stepLabels = [t('sell.step1'), t('sell.step2'), t('sell.step3')];

  return (
    <div style={{ margin: 'calc(var(--space-4) * -1)', paddingBottom: 76 }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '2px solid var(--color-divider)' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{t('sell.title')}</h1>
      </div>

      {/* Indicateur d'étapes : trois cases jointives, l'active en inversé */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-divider)' }}>
        {stepLabels.map((labelText, i) => (
          <div
            key={labelText}
            style={{
              flex: 1,
              padding: '9px 8px',
              fontSize: '10px',
              fontWeight: step === i + 1 ? 800 : 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: 'center',
              borderLeft: i === 0 ? 0 : '1px solid var(--color-rule)',
              background: step === i + 1 ? 'var(--color-text)' : 'transparent',
              color: step === i + 1 ? 'var(--color-highlight)' : 'var(--color-neutral-700)',
            }}
          >
            {i + 1} · {labelText}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4)' }}>
        {error && <div style={errorBox}>{error}</div>}

        {isPublished && (
          <div style={{ ...noticeBox, marginBottom: 'var(--space-4)' }}>
            {t('sell.editPublishedNotice')}
          </div>
        )}

        {step === 1 && (
          <>
            <label style={label}>{t('sell.businessTitle')}</label>
            <input style={field} value={form.title} onChange={set('title')} maxLength={120} required />

            <label style={label}>{t('sell.description')}</label>
            <textarea
              style={{ ...field, minHeight: 120, resize: 'vertical' }}
              value={form.description}
              onChange={set('description')}
              required
            />

            <label style={label}>{t('search.country')}</label>
            <div style={segGroup}>
              {COUNTRIES.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, country: c }))}
                  style={segOption(form.country === c, i === 0)}
                >
                  {c}
                </button>
              ))}
            </div>

            <label style={label}>{t('sell.city')}</label>
            <input style={field} value={form.city} onChange={set('city')} required />

            <label style={label}>{t('search.sector')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 'var(--space-3)' }}>
              {SECTORS.map((s) => {
                const active = form.sector === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sector: s }))}
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

            <label style={label}>{t('search.businessType')}</label>
            <div style={segGroup}>
              {BUSINESS_TYPES.map((bt, i) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, businessType: bt }))}
                  style={segOption(form.businessType === bt, i === 0)}
                >
                  {t(`businessTypes.${bt}`)}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {moneyField('sell.annualRevenue', 'annualRevenue')}
            {moneyField('sell.netProfit', 'netProfit')}
            {moneyField('sell.askingPrice', 'askingPrice')}

            <label style={label}>{t('sell.foundedYear')}</label>
            <input
              style={field}
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={form.foundedYear}
              onChange={set('foundedYear')}
            />

            <label style={label}>{t('listing.employees')}</label>
            <input style={field} type="number" min={0} value={form.employees} onChange={set('employees')} />

            <label style={label}>{t('sell.reasonForSale')}</label>
            <textarea
              style={{ ...field, minHeight: 82, resize: 'vertical' }}
              value={form.reasonForSale}
              onChange={set('reasonForSale')}
              required
            />

            <div style={noticeBox}>{t('sell.moderationNote')}</div>
          </>
        )}

        {step === 3 && businessId && (
          <ImageUploader businessId={businessId} images={images} onChange={setImages} />
        )}
      </div>

      {/* Barre d'action fixe */}
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
        {step > 1 && (
          <button onClick={() => setStep((s) => Math.max(1, s - 1) as Step)} style={btnSecondary}>
            {t('common.back')}
          </button>
        )}
        {step < 3 && (
          <button onClick={() => void saveAndNext()} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
            {saving ? t('common.loading') : t('sell.saveAndContinue')}
          </button>
        )}
        {step === 3 && (
          <button onClick={() => void submitForReview()} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
            {saving
              ? t('common.loading')
              : isPublished
                ? t('sell.saveChanges')
                : t('sell.submit')}
          </button>
        )}
      </div>
    </div>
  );
}
