import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { useAuthStore } from './stores/auth.store';
import { useFavoritesStore } from './stores/favorites.store';

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
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const UnsubscribeAlertPage = lazy(() => import('./pages/UnsubscribeAlertPage').then((m) => ({ default: m.UnsubscribeAlertPage })));

function Fallback() {
  return <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 32 }}>…</p>;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const loadFavorites = useFavoritesStore((s) => s.load);
  useEffect(() => {
    void fetchMe(); // Restaure la session au chargement
    void loadFavorites(); // Ne fait rien sans jeton
  }, [fetchMe, loadFavorites]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Landing marketing : hors Layout, elle a son en-tête et son pied */}
          <Route path="/landing" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/businesses/:id" element={<ListingDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Désinscription d'alerte : sans compte, le jeton fait autorité */}
            <Route path="/alerts/unsubscribe" element={<UnsubscribeAlertPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:businessId/:interlocutorId" element={<ConversationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
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
