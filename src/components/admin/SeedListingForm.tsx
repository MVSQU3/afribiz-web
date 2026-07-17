import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { BUSINESS_TYPES, COUNTRIES, SECTORS } from '../../lib/types';
import { field, label, errorBox, submitBtn } from '../auth/AuthForm.css';

const EMPTY = {
  seller: { firstName: '', lastName: '', phone: '', email: '', country: 'CI' },
  business: {
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
  },
};

export function SeedListingForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState(structuredClone(EMPTY));
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setSeller = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, seller: { ...f.seller, [k]: e.target.value } }));
  const setBiz = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, business: { ...f.business, [k]: value } }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        seller: { ...form.seller, email: form.seller.email || undefined },
        business: form.business,
      };
      const { data } = await api.post<{ businessId: string }>('/admin/seed-listing', payload);
      setCreated(data.businessId);
      setForm(structuredClone(EMPTY));
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="card" style={{ padding: 'var(--space-6)' }}>
      {error && <div style={errorBox}>{error}</div>}
      {created && (
        <div style={{ ...errorBox, background: '#ecfdf5', color: 'var(--color-success)' }}>
          {t('seed.created')}{' '}
          <Link to={`/sell?id=${created}`} style={{ fontWeight: 700 }}>{t('seed.addPhotos')}</Link>
          {' · '}
          <Link to={`/businesses/${created}`} style={{ fontWeight: 700 }}>{t('dashboard.view')}</Link>
        </div>
      )}

      <h3 style={{ marginTop: 0 }}>{t('seed.sellerSection')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-3)' }}>
        <div>
          <label style={label}>{t('auth.firstName')}</label>
          <input style={field} value={form.seller.firstName} onChange={setSeller('firstName')} required />
        </div>
        <div>
          <label style={label}>{t('auth.lastName')}</label>
          <input style={field} value={form.seller.lastName} onChange={setSeller('lastName')} required />
        </div>
      </div>
      <label style={label}>{t('auth.phone')}</label>
      <input style={field} value={form.seller.phone} onChange={setSeller('phone')} placeholder="+2250701020304" required />
      <label style={label}>{t('auth.email')} ({t('seed.optional')})</label>
      <input style={field} type="email" value={form.seller.email} onChange={setSeller('email')} />
      <label style={label}>{t('auth.country')}</label>
      <select style={field} value={form.seller.country} onChange={setSeller('country')}>
        {COUNTRIES.map((c) => <option key={c} value={c}>{t(`countries.${c}`)}</option>)}
      </select>

      <h3>{t('seed.businessSection')}</h3>
      <label style={label}>{t('sell.businessTitle')}</label>
      <input style={field} value={form.business.title} onChange={setBiz('title')} required />
      <label style={label}>{t('sell.description')}</label>
      <textarea style={{ ...field, minHeight: 80 }} value={form.business.description} onChange={setBiz('description')} required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-3)' }}>
        <div>
          <label style={label}>{t('search.country')}</label>
          <select style={field} value={form.business.country} onChange={setBiz('country')}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{t(`countries.${c}`)}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>{t('sell.city')}</label>
          <input style={field} value={form.business.city} onChange={setBiz('city')} required />
        </div>
        <div>
          <label style={label}>{t('search.sector')}</label>
          <select style={field} value={form.business.sector} onChange={setBiz('sector')}>
            {SECTORS.map((s) => <option key={s} value={s}>{t(`sectors.${s}`)}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>{t('search.businessType')}</label>
          <select style={field} value={form.business.businessType} onChange={setBiz('businessType')}>
            {BUSINESS_TYPES.map((bt) => <option key={bt} value={bt}>{t(`businessTypes.${bt}`)}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>{t('sell.foundedYear')}</label>
          <input style={field} type="number" min={1900} max={new Date().getFullYear()} value={form.business.foundedYear} onChange={setBiz('foundedYear')} />
        </div>
        <div>
          <label style={label}>{t('listing.employees')}</label>
          <input style={field} type="number" min={0} value={form.business.employees} onChange={setBiz('employees')} />
        </div>
        <div>
          <label style={label}>{t('sell.annualRevenue')}</label>
          <input style={field} type="number" min={0} value={form.business.annualRevenue} onChange={setBiz('annualRevenue')} />
        </div>
        <div>
          <label style={label}>{t('sell.netProfit')}</label>
          <input style={field} type="number" min={0} value={form.business.netProfit} onChange={setBiz('netProfit')} />
        </div>
      </div>
      <label style={label}>{t('sell.askingPrice')}</label>
      <input style={field} type="number" min={1} value={form.business.askingPrice} onChange={setBiz('askingPrice')} required />
      <label style={label}>{t('sell.reasonForSale')}</label>
      <textarea style={{ ...field, minHeight: 60 }} value={form.business.reasonForSale} onChange={setBiz('reasonForSale')} required />

      <button style={submitBtn} disabled={saving}>
        {saving ? t('common.loading') : t('seed.create')}
      </button>
    </form>
  );
}
