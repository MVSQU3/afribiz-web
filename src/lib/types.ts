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


/** Catégories de l'annuaire — miroir de `DirectoryCategory` côté API. */
export const DIRECTORY_CATEGORIES = [
  'fintech',
  'logistics',
  'health',
  'agritech',
  'edtech',
  'hr',
  'commerce',
  'devtools',
] as const;

export type DirectoryCategory = (typeof DIRECTORY_CATEGORIES)[number];

/**
 * Entrée de l'annuaire, telle que l'API la renvoie **au public**.
 *
 * Les champs de modération (`status`, `submitterEmail`, `moderationNote`,
 * `position`) n'y figurent pas : le service les exclut de sa sélection. Les
 * déclarer ici laisserait croire qu'on peut s'en servir, et un `entry.status`
 * vaudrait `undefined` à l'exécution sans que TypeScript proteste.
 */
export interface Directory {
  id: string;
  slug: string;
  name: string;
  website: string;
  descriptionFr: string;
  descriptionEn: string;
  category: DirectoryCategory;
  subcategory: string | null;
  country: string;
  city: string | null;
  foundedYear: number | null;
  isVerified: boolean;
  publishedAt: string | null;
}

export type DirectoryStatus = 'pending' | 'published' | 'rejected';

/**
 * Entrée telle que la renvoient les routes `/directory/admin`.
 *
 * Elle porte les champs de modération que la liste publique n'expose pas —
 * d'où un type distinct plutôt qu'un `Directory` aux champs optionnels : sur
 * l'écran d'administration ils sont toujours là, et les rendre facultatifs
 * obligerait à les tester partout.
 */
export interface DirectoryAdmin extends Directory {
  status: DirectoryStatus;
  submitterEmail: string | null;
  moderationNote: string | null;
  position: number;
  createdAt: string;
}

export interface DirectoryResult {
  items: Directory[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Corps de POST /directory/submissions. */
export interface DirectorySubmission {
  name: string;
  website: string;
  descriptionFr: string;
  descriptionEn: string;
  category: DirectoryCategory | '';
  country: string;
  city?: string;
  foundedYear?: number;
  submitterEmail?: string;
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