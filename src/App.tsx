import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate, useParams } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Eager — used on consumer QR-scan path or auth path (must load immediately)
import BottlePage from '@/pages/BottlePage';
import AdminLogin from '@/pages/AdminLogin';
// AdminSignup removed — self-registration disabled; use invite-user edge function
import AdminForgotPassword from '@/pages/AdminForgotPassword';
import AdminResetPassword from '@/pages/AdminResetPassword';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import NotFound from '@/pages/NotFound';

// Lazy — admin-only routes, split into their own chunks
const AdminDashboard           = lazy(() => import('@/pages/AdminDashboard'));
const AdminProductDetail       = lazy(() => import('@/pages/AdminProductDetail'));
const AdminAiUpload            = lazy(() => import('@/pages/AdminAiUpload'));
const AdminImageLibrary        = lazy(() => import('@/pages/AdminImageLibrary'));
const AdminAnalytics           = lazy(() => import('@/pages/AdminAnalytics'));
const AdminActivations         = lazy(() => import('@/pages/AdminActivations'));
const AdminActivationEditor    = lazy(() => import('@/pages/AdminActivationEditor'));
const AdminDefaultLayout       = lazy(() => import('@/pages/AdminDefaultLayout'));
const AdminLineContent         = lazy(() => import('@/pages/AdminLineContent'));
const AdminCollaborations      = lazy(() => import('@/pages/AdminCollaborations'));
const AdminCollaborationDetail = lazy(() => import('@/pages/AdminCollaborationDetail'));
const AdminCustom              = lazy(() => import('@/pages/AdminCustom'));
const AdminCustomDetail        = lazy(() => import('@/pages/AdminCustomDetail'));
const AdminSiteSettings        = lazy(() => import('@/pages/AdminSiteSettings'));
const AdminUsers               = lazy(() => import('@/pages/AdminUsers'));
const AdminChangeLog           = lazy(() => import('@/pages/AdminChangeLog'));

/** Redirect /bottle/:slug → /b/classy/:slug for backward-compat QR codes */
function LegacyBottleRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/b/classy/${slug}`} replace />;
}

/** Redirect /admin/collaborations/:brandSlug → /admin/custom/:brandSlug */
function LegacyCollabRedirect() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  return <Navigate to={`/admin/custom/${brandSlug}`} replace />;
}

function AdminLoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppInner() {
  const initialize = useAuthStore((s) => s.initialize);
  const cleanup = useAuthStore((s) => s.cleanup);

  useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);

  return (
    <BrowserRouter>
      <Suspense fallback={<AdminLoadingSpinner />}>
      <Routes>
        {/* Consumer DPP — /b/:brandSlug/:productSlug */}
        <Route path="/b/:brandSlug/:productSlug" element={
          <ErrorBoundary fallback={
            <div className="consumer-theme min-h-screen bg-cc-cream flex items-center justify-center">
              <p className="font-sans-consumer text-sm text-cc-text-md">Something went wrong. Please scan the QR code again.</p>
            </div>
          }>
            <BottlePage />
          </ErrorBoundary>
        } />
        {/* Legacy redirect: /bottle/:slug → /b/classy/:slug */}
        <Route path="/bottle/:slug" element={<LegacyBottleRedirect />} />

        {/* Privacy policy — public, no auth required */}
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/product/:slug"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminProductDetail />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-upload"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminAiUpload />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/images"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminImageLibrary />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminAnalytics />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/default-layout"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminDefaultLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/line-content"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminLineContent />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activations"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminActivations />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activations/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminActivationEditor />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* New Custom routes */}
        <Route
          path="/admin/custom"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminCustom />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/custom/:brandSlug"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminCustomDetail />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        {/* Legacy redirects — keep old URLs working */}
        <Route path="/admin/collaborations" element={<Navigate to="/admin/custom" replace />} />
        <Route
          path="/admin/collaborations/:brandSlug"
          element={<LegacyCollabRedirect />}
        />
        <Route
          path="/admin/site-settings"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminSiteSettings />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminUsers />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/changes"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminChangeLog />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppInner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
