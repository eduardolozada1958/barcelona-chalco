import { Routes, Route, Navigate } from 'react-router-dom';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { ConfirmEmailChangePage } from '@/pages/ConfirmEmailChangePage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { CredentialPage } from '@/pages/CredentialPage';
import { CredentialArPage } from '@/pages/CredentialArPage';
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
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage';
import { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage';
import { SupportPage } from '@/pages/legal/SupportPage';

import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage';
import { DashboardPlayersPage } from '@/pages/dashboard/DashboardPlayersPage';
import { DashboardPlayerDetailPage } from '@/pages/dashboard/DashboardPlayerDetailPage';
import { MyPlayersPage } from '@/pages/dashboard/MyPlayersPage';
import { DashboardLinkRequestsPage } from '@/pages/dashboard/DashboardLinkRequestsPage';
import { DashboardCommentsPage } from '@/pages/dashboard/DashboardCommentsPage';
import { DashboardMatchesPage } from '@/pages/dashboard/DashboardMatchesPage';
import { DashboardResultsPage } from '@/pages/dashboard/DashboardResultsPage';
import { DashboardNoticesPage } from '@/pages/dashboard/DashboardNoticesPage';
import { DashboardGalleryPage } from '@/pages/dashboard/DashboardGalleryPage';
import { DashboardUsersPage } from '@/pages/dashboard/DashboardUsersPage';
import { DashboardSettingsPage } from '@/pages/dashboard/DashboardSettingsPage';
import { DashboardAccountPage } from '@/pages/dashboard/DashboardAccountPage';
import { DashboardGuidePage } from '@/pages/dashboard/DashboardGuidePage';

export default function App() {
  return (
    <Routes>
      <Route path="/credencial-ar/:token" element={<CredentialArPage />} />
      <Route path="/credencial/:token" element={<CredentialPage />} />
      <Route path="/credencial" element={<CredentialPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/olvide-contraseña" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route path="/confirmar-email" element={<ConfirmEmailChangePage />} />
        <Route path="/contacto" element={<InscriptionPublicPage />} />
        <Route path="/inscripcion" element={<Navigate to="/contacto" replace />} />
        <Route path="/partidos" element={<PublicMatchesPage />} />
        <Route path="/partidos/:id" element={<PublicMatchDetailPage />} />
        <Route path="/resultados" element={<PublicResultsPage />} />
        <Route path="/avisos" element={<PublicNoticesPage />} />
        <Route path="/avisos/:id" element={<PublicNoticeDetailPage />} />
        <Route path="/galeria" element={<PublicGalleryPage />} />
        <Route path="/galeria/:id" element={<PublicGalleryDetailPage />} />
        <Route path="/jugadores" element={<PublicPlayersPage />} />
        <Route path="/jugadores/:id" element={<PublicPlayerDetailPage />} />
        <Route path="/privacidad" element={<PrivacyPolicyPage />} />
        <Route path="/terminos" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/soporte" element={<SupportPage />} />
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
        <Route path="guia" element={<DashboardGuidePage />} />
        <Route path="cuenta" element={<DashboardAccountPage />} />
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
          path="link-requests"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardLinkRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="comments"
          element={
            <ProtectedRoute roles={['admin', 'coach']}>
              <DashboardCommentsPage />
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
