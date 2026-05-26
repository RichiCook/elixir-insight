import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BottlePage from '@/pages/BottlePage';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminProductDetail from '@/pages/AdminProductDetail';
import AdminAiUpload from '@/pages/AdminAiUpload';
import AdminImageLibrary from '@/pages/AdminImageLibrary';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminActivations from '@/pages/AdminActivations';
import AdminActivationEditor from '@/pages/AdminActivationEditor';
import AdminDefaultLayout from '@/pages/AdminDefaultLayout';
import AdminCollaborations from '@/pages/AdminCollaborations';
import AdminCollaborationDetail from '@/pages/AdminCollaborationDetail';
import AdminSiteSettings from '@/pages/AdminSiteSettings';
import AdminUsers from '@/pages/AdminUsers';
import AdminForgotPassword from '@/pages/AdminForgotPassword';
import AdminResetPassword from '@/pages/AdminResetPassword';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import NotFound from '@/pages/NotFound';

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
      <Routes>
        {/* Consumer DPP */}
        <Route path="/bottle/:slug" element={
          <ErrorBoundary fallback={
            <div className="consumer-theme min-h-screen bg-cc-cream flex items-center justify-center">
              <p className="font-sans-consumer text-sm text-cc-text-md">Something went wrong. Please scan the QR code again.</p>
            </div>
          }>
            <BottlePage />
          </ErrorBoundary>
        } />

        {/* Privacy policy — public, no auth required */}
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
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

        <Route
          path="/admin/collaborations"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminCollaborations />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/collaborations/:brandSlug"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminCollaborationDetail />
              </ErrorBoundary>
            </ProtectedRoute>
          }
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

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
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
