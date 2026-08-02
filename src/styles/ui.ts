// Primitives de style du design system moderniste, en objets JS — même
// convention que AuthForm.css.ts : pas de framework CSS, pas de CSS-in-JS.
// Les tokens vivent dans index.css, ce fichier ne fait que les composer.
import type { CSSProperties } from 'react';

/* ----------------------------- Typographie ----------------------------- */

/** Intitulé de section / de champ : petites capitales espacées. */
export const overline: CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-700)',
  // Longhands plutôt que `margin: 0` : ces objets sont systématiquement étendus
  // avec un `marginBottom`, et React avertit quand raccourci et propriété
  // détaillée se disputent la même valeur entre deux rendus.
  marginTop: 0,
  marginBottom: 0,
};

/** Variante sombre de l'overline, sur fond clair (titres de bloc). */
export const overlineStrong: CSSProperties = {
  ...overline,
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: 'var(--color-text)',
};

/** Note technique : monospace, réservée aux valeurs en attente. */
export const mono: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.06em',
  color: 'var(--color-neutral-600)',
  marginTop: 0,
  marginBottom: 0,
};

export const muted: CSSProperties = {
  color: 'var(--color-neutral-700)',
  fontSize: 'var(--text-sm)',
};

/* ------------------------------- Filets -------------------------------- */

/** Séparateur majeur — 2px, structure les sections. */
export const ruleStrong: CSSProperties = {
  height: 2,
  border: 0,
  background: 'var(--color-divider)',
  margin: 0,
};

/** Séparateur mineur — 1px, sépare deux lignes d'une même liste. */
export const ruleLight: CSSProperties = {
  height: 1,
  border: 0,
  background: 'var(--color-rule)',
  margin: 0,
};

/* ------------------------------ Boutons -------------------------------- */

const btnBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '13px 14px',
  fontFamily: 'var(--font-heading)',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
  borderRadius: 0,
};

export const btnPrimary: CSSProperties = {
  ...btnBase,
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: '2px solid var(--color-accent)',
};

export const btnSecondary: CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--color-text)',
  border: '2px solid var(--color-divider)',
};

/** Action sombre — le contraste maximal du système (CTA d'un bloc lime). */
export const btnDark: CSSProperties = {
  ...btnBase,
  background: 'var(--color-text)',
  color: 'var(--color-highlight)',
  border: '2px solid var(--color-text)',
};

export const btnDanger: CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '2px solid var(--color-danger)',
};

/** Bouton d'action secondaire compact (lignes du tableau de bord, admin). */
export const btnSmall: CSSProperties = {
  ...btnBase,
  padding: '7px 10px',
  fontSize: '10px',
  letterSpacing: '0.06em',
  border: '1px solid var(--color-divider)',
  background: 'transparent',
  color: 'var(--color-text)',
};

/* ----------------------------- Formulaires ----------------------------- */

export const field: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontFamily: 'inherit',
  fontSize: '14px',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '2px solid var(--color-divider)',
  borderRadius: 0,
  boxSizing: 'border-box',
  marginBottom: 'var(--space-3)',
};

export const label: CSSProperties = {
  ...overline,
  display: 'block',
  marginBottom: 5,
};

export const errorBox: CSSProperties = {
  background: 'var(--color-danger-bg)',
  color: 'var(--color-danger)',
  border: '2px solid var(--color-danger)',
  padding: '9px 12px',
  fontSize: 'var(--text-xs)',
  marginBottom: 'var(--space-3)',
};

export const successBox: CSSProperties = {
  background: 'var(--color-highlight)',
  color: 'var(--color-accent-800)',
  border: '2px solid var(--color-divider)',
  padding: '9px 12px',
  fontSize: 'var(--text-xs)',
  marginBottom: 'var(--space-3)',
};

/** Encadré d'information — le champ lime plat, jamais pour du texte courant. */
export const noticeBox: CSSProperties = {
  background: 'var(--color-highlight)',
  border: '2px solid var(--color-divider)',
  padding: '11px 12px',
  fontSize: 'var(--text-xs)',
  lineHeight: 1.45,
  color: 'var(--color-text)',
};

/* -------------------------- Contrôles segmentés ------------------------ */

/** Conteneur d'un groupe d'options jointives (pays, type, langue). */
export const segGroup: CSSProperties = {
  display: 'flex',
  border: '2px solid var(--color-divider)',
  marginBottom: 'var(--space-3)',
};

/** Option d'un groupe segmenté ; `active` inverse le contraste. */
export function segOption(active: boolean, first = false): CSSProperties {
  return {
    flex: 1,
    padding: '9px 6px',
    textAlign: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: active ? 800 : 600,
    letterSpacing: '0.04em',
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? 'var(--color-bg)' : 'var(--color-text)',
    border: 0,
    borderLeft: first ? 0 : '1px solid var(--color-rule)',
    borderRadius: 0,
  };
}

/* ------------------------------- Écrans -------------------------------- */

/** En-tête de page : titre sur filet 2px, pleine largeur du contenu. */
export const screenHeader: CSSProperties = {
  borderBottom: '2px solid var(--color-divider)',
  paddingBottom: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

/** Ligne de liste : filet fin en haut, contenu à plat. */
export const listRow: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) 0',
  borderTop: '1px solid var(--color-rule)',
  alignItems: 'flex-start',
};

/** Vignette photo — toujours en noir et blanc, jamais arrondie. */
export function thumb(url: string | null, w: number, h: number): CSSProperties {
  return {
    width: w,
    height: h,
    flex: 'none',
    filter: 'grayscale(1) contrast(1.08)',
    background: url
      ? `url(${url}) center/cover`
      : 'repeating-linear-gradient(135deg, var(--color-neutral-300) 0 6px, var(--color-surface) 6px 12px)',
  };
}

/** Pastille d'initiales de l'interlocuteur (messagerie, profil). */
export function avatar(size: number): CSSProperties {
  return {
    width: size,
    height: size,
    flex: 'none',
    background: 'var(--color-accent-2)',
    display: 'grid',
    placeItems: 'center',
    fontSize: Math.round(size * 0.36),
    fontWeight: 800,
    color: 'var(--color-text)',
  };
}

/** Deux lettres d'initiales à partir d'un prénom et d'un nom. */
export function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—';
}

/** Barre d'actions collée en bas de l'écran, au-dessus du bottom nav. */
export const actionBar: CSSProperties = {
  position: 'fixed',
  bottom: 'var(--bottom-nav-height)',
  left: 0,
  right: 0,
  zIndex: 5,
  display: 'flex',
  gap: 'var(--space-2)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--color-bg)',
  borderTop: '2px solid var(--color-divider)',
};
