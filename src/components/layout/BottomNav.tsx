import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const items = [
  { to: '/', key: 'nav.home', icon: '🏠' },
  { to: '/search', key: 'nav.search', icon: '🔍' },
  { to: '/messages', key: 'nav.messages', icon: '✉️' },
  { to: '/dashboard', key: 'nav.dashboard', icon: '👤' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-nav)',
        display: 'flex',
        zIndex: 10,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 700 : 400,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          })}
        >
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          {t(item.key)}
        </NavLink>
      ))}
    </nav>
  );
}
