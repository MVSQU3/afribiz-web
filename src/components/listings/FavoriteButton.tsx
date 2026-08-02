import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavoritesStore } from '../../stores/favorites.store';

/**
 * Bouton de mise en favori.
 *
 * Le repère visuel est un carré plein / vide plutôt qu'un cœur : le design
 * system n'a aucun arrondi et n'utilise pas de pictogramme décoratif.
 */
export function FavoriteButton({
  businessId,
  size = 'small',
}: {
  businessId: string;
  size?: 'small' | 'large';
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ids = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);

  const isFavorite = ids.has(businessId);
  const large = size === 'large';

  const onClick = (e: React.MouseEvent) => {
    // Le bouton vit à l'intérieur d'un lien vers l'annonce : sans ça, cliquer
    // sur « garder » naviguerait vers la fiche.
    e.preventDefault();
    e.stopPropagation();

    // On teste le jeton, pas l'objet utilisateur : au premier rendu `fetchMe`
    // n'a pas encore répondu et un visiteur connecté serait renvoyé au login.
    // Même critère que RequireAuth.
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    void toggle(businessId);
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
      title={isFavorite ? t('favorites.remove') : t('favorites.add')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        flex: 'none',
        padding: large ? '10px var(--space-4)' : '4px 8px',
        fontSize: large ? 'var(--text-xs)' : '10px',
        fontWeight: 800,
        letterSpacing: large ? '0.1em' : '0.06em',
        textTransform: 'uppercase',
        border: large ? 0 : `1px solid ${isFavorite ? 'var(--color-divider)' : 'var(--color-rule)'}`,
        background: isFavorite && !large ? 'var(--color-text)' : 'transparent',
        color: isFavorite
          ? large
            ? 'var(--color-accent-700)'
            : 'var(--color-highlight)'
          : large
            ? 'var(--color-accent-700)'
            : 'var(--color-neutral-700)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: large ? 12 : 10 }}>
        {isFavorite ? '■' : '□'}
      </span>
      {large ? (isFavorite ? t('favorites.saved') : t('favorites.save')) : null}
    </button>
  );
}
