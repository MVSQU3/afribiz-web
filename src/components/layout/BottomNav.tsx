import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Quatre onglets, sans icône : le design system porte la hiérarchie par le
// contraste et les capitales, pas par des pictogrammes.
const items = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/search', key: 'nav.search', end: false },
  { to: '/messages', key: 'nav.messages', end: false },
  { to: '/dashboard', key: 'nav.account', end: false },
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
        background: 'var(--color-bg)',
        borderTop: '2px solid var(--color-divider)',
        display: 'flex',
        zIndex: 10,
      }}
    >
      {items.map((item, i) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: isActive ? 800 : 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderLeft: i === 0 ? 'none' : '1px solid var(--color-rule)',
            background: isActive ? 'var(--color-text)' : 'transparent',
            color: isActive ? 'var(--color-highlight)' : 'var(--color-neutral-700)',
          })}
        >
          {t(item.key)}
        </NavLink>
      ))}
    </nav>
  );
}
