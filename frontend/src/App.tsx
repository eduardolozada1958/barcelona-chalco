import { Routes, Route } from 'react-router-dom';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CredentialPage } from '@/pages/CredentialPage';
import { InscriptionPublicPage } from '@/pages/InscriptionPublicPage';
import { PublicMatchesPage } from '@/pages/PublicMatchesPage';
import { PublicMatchDetailPage } from '@/pages/PublicMatchDetailPage';
import { PublicResultsPage } from '@/pages/PublicResultsPage';
import { PublicNoticesPage } from '@/pages/PublicNoticesPage';
import { PublicNoticeDetailPage } from '@/pages/PublicNoticeDetailPage';
import { PublicGalleryPage } from '@/pages/PublicGalleryPage';
import { PublicGalleryDetailPage } from '@/pages/PublicGalleryDetailPage';
import { PublicPlayersPage } from '@/pages/PublicPlayersPage';
import { PublicPlayerDetailPage } from '@/pages/PublicPlayerDetailPage';

import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage';
import { DashboardPlayersPage } from '@/pages/dashboard/DashboardPlayersPage';
import { DashboardPlayerDetailPage } from '@/pages/dashboard/DashboardPlayerDetailPage';
import { MyPlayersPage } from '@/pages/dashboard/MyPlayersPage';
import { DashboardMatchesPage } from '@/pages/dashboard/DashboardMatchesPage';
import { DashboardResultsPage } from '@/pages/dashboard/DashboardResultsPage';
import { DashboardNoticesPage } from '@/pages/dashboard/DashboardNoticesPage';
import { DashboardGalleryPage } from '@/pages/dashboard/DashboardGalleryPage';
import { DashboardInscriptionsPage } from '@/pages/dashboard/DashboardInscriptionsPage';
import { DashboardUsersPage } from '@/pages/dashboard/DashboardUsersPage';
import { DashboardSettingsPage } from '@/pages/dashboard/DashboardSettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/credencial/:token" element={<CredentialPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/inscripcion" element={<InscriptionPublicPage />} />
        <Route path="/partidos" element={<PublicMatchesPage />} />
        <Route path="/partidos/:id" element={<PublicMatchDetailPage />} />
        <Route path="/resultados" element={<PublicResultsPage />} />
        <Route path="/avisos" element={<PublicNoticesPage />} />
        <Route path="/avisos/:id" element={<PublicNoticeDetailPage />} />
        <Route path="/galeria" element={<PublicGalleryPage />} />
        <Route path="/galeria/:id" element={<PublicGalleryDetailPage />} />
        <Route path="/jugadores" element={<PublicPlayersPage />} />
        <Route path="/jugadores/:id" element={<PublicPlayerDetailPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="mis-jugadores" element={<MyPlayersPage />} />
        <Route
          path="players"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardPlayersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="players/:id"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardPlayerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="matches"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="results"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="notices"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardNoticesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="gallery"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardGalleryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inscriptions"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardInscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <DashboardUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <DashboardSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
