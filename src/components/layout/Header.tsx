import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/app.store';
import { useAuthStore } from '../../stores/auth.store';

/** Ligne d'état des maquettes : langue et devise, alignées à droite. */
function StatusStrip({ language }: { language: 'fr' | 'en' }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '6px var(--space-4) 2px',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'var(--color-neutral-700)',
      }}
    >
      {language.toUpperCase()} · XOF
    </div>
  );
}

const navLink = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
} as const;

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();
  const { user, logout } = useAuthStore();

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)' }}>
      <StatusStrip language={language} />
      <header
        style={{
          height: 'var(--header-height)',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: '0 var(--space-4)',
        }}
      >
        <Link to="/" className="wordmark" style={{ fontSize: 'var(--text-lg)' }}>
          {t('app.name')}
        </Link>
        <nav style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* Bascule de langue : deux cases jointives, l'active en inversé */}
          <div style={{ display: 'flex', border: '2px solid var(--color-divider)' }}>
            {(['fr', 'en'] as const).map((lng, i) => (
              <button
                key={lng}
                onClick={() => setLanguage(lng)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: language === lng ? 800 : 600,
                  letterSpacing: '0.06em',
                  border: 0,
                  borderLeft: i === 0 ? 0 : '1px solid var(--color-rule)',
                  background: language === lng ? 'var(--color-text)' : 'transparent',
                  color: language === lng ? 'var(--color-highlight)' : 'var(--color-text)',
                }}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          {user?.role === 'admin' && (
            <Link to="/admin" style={navLink}>
              {t('nav.admin')}
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{
                ...navLink,
                border: 0,
                background: 'transparent',
                color: 'var(--color-neutral-700)',
              }}
            >
              {t('nav.logout')}
            </button>
          ) : (
            <Link to="/login" style={navLink}>
              {t('nav.login')}
            </Link>
          )}
        </nav>
      </header>
    </div>
  );
}
