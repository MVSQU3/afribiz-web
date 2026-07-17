import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { useAuthStore } from './stores/auth.store';

// Code splitting : seule la homepage est dans le bundle initial,
// le reste se charge à la navigation (budget JS mobile).
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage').then((m) => ({ default: m.ListingDetailPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const ConversationPage = lazy(() => import('./pages/ConversationPage').then((m) => ({ default: m.ConversationPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SellWizardPage = lazy(() => import('./pages/SellWizardPage').then((m) => ({ default: m.SellWizardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function Fallback() {
  return <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 32 }}>…</p>;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    void fetchMe(); // Restaure la session au chargement
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/businesses/:id" element={<ListingDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:businessId/:interlocutorId" element={<ConversationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/sell" element={<SellWizardPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
