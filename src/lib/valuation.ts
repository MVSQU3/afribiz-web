import type { Business } from './types';

/**
 * Indicateurs d'évaluation d'une reprise d'entreprise.
 *
 * Un repreneur ne compare pas des montants, il compare des ratios : un business
 * à 45 M qui dégage 14 M de bénéfice est bien moins cher qu'un business à 20 M
 * qui en dégage 2 M. Ces fonctions dérivent ces ratios des seules données déjà
 * saisies dans l'annonce — aucune donnée supplémentaire n'est demandée au
 * vendeur, aucune colonne ajoutée en base.
 *
 * Toutes renvoient `null` quand le calcul n'a pas de sens (division par zéro,
 * activité déficitaire) : à l'appelant d'afficher un tiret plutôt qu'un chiffre
 * faux. Les montants arrivent de Postgres en `numeric`, donc sous forme de
 * chaînes — d'où le `toNumber()` systématique.
 */

function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Multiple de rentabilité : combien de fois le bénéfice annuel le prix
 * représente-t-il. C'est la mesure de référence d'une cession.
 *
 * `null` si le bénéfice est nul ou négatif : un multiple négatif n'a aucun
 * sens, et une activité déficitaire s'évalue sur d'autres bases (actifs,
 * clientèle) qu'il serait trompeur de résumer par un ratio.
 */
export function profitMultiple(business: Business): number | null {
  const price = toNumber(business.askingPrice);
  const profit = toNumber(business.netProfit);
  if (price <= 0 || profit <= 0) return null;
  return price / profit;
}

/**
 * Marge nette : part du chiffre d'affaires qui reste en bénéfice, en %.
 * Peut être négative — une perte est une information légitime à afficher.
 */
export function netMargin(business: Business): number | null {
  const revenue = toNumber(business.annualRevenue);
  const profit = toNumber(business.netProfit);
  if (revenue <= 0) return null;
  return (profit / revenue) * 100;
}

/** Multiple du chiffre d'affaires — utile quand le bénéfice est faible ou nul. */
export function revenueMultiple(business: Business): number | null {
  const price = toNumber(business.askingPrice);
  const revenue = toNumber(business.annualRevenue);
  if (price <= 0 || revenue <= 0) return null;
  return price / revenue;
}

/** L'activité est-elle déficitaire ? Change la lecture de toute la fiche. */
export function isLossMaking(business: Business): boolean {
  return toNumber(business.netProfit) < 0;
}

/* ------------------------------- Formatage ------------------------------- */

/** « 3,2× » en français, « 3.2× » en anglais. */
export function formatMultiple(value: number, lang: string): string {
  return `${new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}×`;
}

/** « 17 % » — sans décimale, la précision serait illusoire à ce stade. */
export function formatPercent(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

/**
 * Durée de rentabilisation en années, arrondie : formulation plus parlante que
 * le multiple pour un repreneur qui n'est pas financier. Même ratio, autre mot.
 *
 * Renvoie 0 sous un an — un business qui se rembourse en huit mois est un
 * argument de vente qu'il serait dommage d'arrondir à « 1 an ». C'est à
 * l'appelant de traduire ce 0 en « moins d'un an » (le pluriel dépend de la
 * langue, il reste donc du côté de l'i18n).
 */
export function paybackYears(multiple: number): number {
  return multiple < 1 ? 0 : Math.round(multiple);
}
