import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--bottom-nav-height)' }}>
      <Header />
      <main
        style={{
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
          padding: 'var(--space-4)',
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
