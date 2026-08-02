// Styles partagés des formulaires auth.
// Les primitives ont été centralisées dans src/styles/ui.ts lors du passage au
// design system moderniste ; ce module reste le point d'import des pages de
// formulaire (auth, vente, profil, admin).
import type { CSSProperties } from 'react';
import { btnPrimary, errorBox, field, label } from '../../styles/ui';

export { field, label, errorBox };

/** Bouton de soumission pleine largeur d'un formulaire. */
export const submitBtn: CSSProperties = {
  ...btnPrimary,
  width: '100%',
  padding: '14px',
  marginTop: 'var(--space-2)',
};
