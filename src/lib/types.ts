import type { BusinessImage } from '../components/listings/ImageUploader';

export const SECTORS = ['commerce', 'tech', 'agriculture', 'restauration', 'services', 'industrie'] as const;
export const BUSINESS_TYPES = ['digital', 'physical', 'hybrid'] as const;
export const COUNTRIES = ['CI', 'SN', 'BJ', 'TG', 'NG', 'GH'] as const;

export type Sector = (typeof SECTORS)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type BusinessStatus = 'draft' | 'pending' | 'published' | 'sold' | 'archived';

export interface Business {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  country: string;
  city: string;
  sector: Sector;
  businessType: BusinessType;
  foundedYear: number;
  employees: number;
  annualRevenue: string | number;
  netProfit: string | number;
  askingPrice: string | number;
  reasonForSale: string;
  status: BusinessStatus;
  isPremium: boolean;
  viewsCount: number;
  publishedAt: string | null;
  createdAt: string;
  images: BusinessImage[];
  seller?: { id: string; firstName: string; country: string; isVerified: boolean };
}

export interface SearchResult {
  items: Business[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const CURRENCIES: Record<string, string> = {
  CI: 'XOF', SN: 'XOF', BJ: 'XOF', TG: 'XOF', NG: 'NGN', GH: 'GHS',
};

export function formatPrice(value: string | number, country: string, lang: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: CURRENCIES[country] ?? 'XOF',
    maximumFractionDigits: 0,
  }).format(num);
}

export function primaryImage(b: Business): string | null {
  const img = b.images?.find((i) => i.isPrimary) ?? b.images?.[0];
  return img ? img.url.replace('/upload/', '/upload/w_600,h_400,c_fill,f_auto/') : null;
}
