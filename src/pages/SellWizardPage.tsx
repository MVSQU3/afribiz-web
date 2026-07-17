import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { BUSINESS_TYPES, COUNTRIES, SECTORS, type Business } from '../lib/types';
import { ImageUploader, type BusinessImage } from '../components/listings/ImageUploader';
import { field, label, errorBox, submitBtn } from '../components/auth/AuthForm.css';

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

  // Reprise d'un draft existant
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
    });
  }, [businessId]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  /** Sauvegarde le draft (create au 1er passage, update ensuite) et passe à l'étape suivante */
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
      await api.post(`/businesses/${businessId}/submit`);
      navigate('/dashboard?submitted=1');
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const stepTitle = [t('sell.step1'), t('sell.step2'), t('sell.step3')][step - 1];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>{t('sell.title')}</h1>

      {/* Indicateur d'étapes */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: s <= step ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>
        {step}/3 — {stepTitle}
      </h2>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        {error && <div style={errorBox}>{error}</div>}

        {step === 1 && (
          <>
            <label style={label}>{t('sell.businessTitle')}</label>
            <input style={field} value={form.title} onChange={set('title')} maxLength={120} required />
            <label style={label}>{t('sell.description')}</label>
            <textarea style={{ ...field, minHeight: 120 }} value={form.description} onChange={set('description')} required />
            <label style={label}>{t('search.country')}</label>
            <select style={field} value={form.country} onChange={set('country')}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{t(`countries.${c}`)}</option>)}
            </select>
            <label style={label}>{t('sell.city')}</label>
            <input style={field} value={form.city} onChange={set('city')} required />
            <label style={label}>{t('search.sector')}</label>
            <select style={field} value={form.sector} onChange={set('sector')}>
              {SECTORS.map((s) => <option key={s} value={s}>{t(`sectors.${s}`)}</option>)}
            </select>
            <label style={label}>{t('search.businessType')}</label>
            <select style={field} value={form.businessType} onChange={set('businessType')}>
              {BUSINESS_TYPES.map((bt) => <option key={bt} value={bt}>{t(`businessTypes.${bt}`)}</option>)}
            </select>
          </>
        )}

        {step === 2 && (
          <>
            <label style={label}>{t('sell.foundedYear')}</label>
            <input style={field} type="number" min={1900} max={new Date().getFullYear()} value={form.foundedYear} onChange={set('foundedYear')} />
            <label style={label}>{t('listing.employees')}</label>
            <input style={field} type="number" min={0} value={form.employees} onChange={set('employees')} />
            <label style={label}>{t('sell.annualRevenue')}</label>
            <input style={field} type="number" min={0} value={form.annualRevenue} onChange={set('annualRevenue')} />
            <label style={label}>{t('sell.netProfit')}</label>
            <input style={field} type="number" min={0} value={form.netProfit} onChange={set('netProfit')} />
            <label style={label}>{t('sell.askingPrice')}</label>
            <input style={field} type="number" min={1} value={form.askingPrice} onChange={set('askingPrice')} />
            <label style={label}>{t('sell.reasonForSale')}</label>
            <textarea style={{ ...field, minHeight: 80 }} value={form.reasonForSale} onChange={set('reasonForSale')} required />
          </>
        )}

        {step === 3 && businessId && (
          <ImageUploader businessId={businessId} images={images} onChange={setImages} />
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {step > 1 && (
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              style={{ ...submitBtn, background: 'var(--color-bg)', color: 'var(--color-text)', flex: 1 }}
            >
              {t('common.back')}
            </button>
          )}
          {step < 3 && (
            <button onClick={() => void saveAndNext()} disabled={saving} style={{ ...submitBtn, flex: 2 }}>
              {saving ? t('common.loading') : t('sell.saveAndContinue')}
            </button>
          )}
          {step === 3 && (
            <button onClick={() => void submitForReview()} disabled={saving} style={{ ...submitBtn, flex: 2 }}>
              {saving ? t('common.loading') : t('sell.submit')}
            </button>
          )}
        </div>
        {step === 3 && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            {t('sell.moderationNote')}
          </p>
        )}
      </div>
    </div>
  );
}
