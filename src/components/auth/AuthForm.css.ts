// Styles partagés des formulaires auth (objet JS pour rester en single-file par composant)
import type { CSSProperties } from 'react';

export const field: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-base)',
  background: 'var(--color-surface)',
  marginBottom: 'var(--space-3)',
  boxSizing: 'border-box',
};

export const label: CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  marginBottom: 'var(--space-1)',
};

export const errorBox: CSSProperties = {
  background: '#fef2f2',
  color: 'var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--space-3)',
};

export const submitBtn: CSSProperties = {
  width: '100%',
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  padding: '14px',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  marginTop: 'var(--space-2)',
};
