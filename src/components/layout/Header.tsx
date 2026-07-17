import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/app.store';
import { useAuthStore } from '../../stores/auth.store';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();
  const { user, logout } = useAuthStore();

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Link to="/" style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>
        {t('app.name')}
      </Link>
      <nav style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <button
          onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
          style={{
            border: '1px solid var(--color-border)',
            background: 'transparent',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px',
            fontSize: 'var(--text-sm)',
          }}
        >
          {language === 'fr' ? 'EN' : 'FR'}
        </button>
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent)' }}>Admin</Link>
        )}
        {user ? (
          <>
            <Link to="/profile" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{user.firstName}</Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <Link to="/login" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {t('nav.login')}
          </Link>
        )}
      </nav>
    </header>
  );
}
