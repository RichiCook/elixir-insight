import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppInner() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Consumer DPP */}
        <Route path="/bottle/:slug" element={<BottlePage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/product/:slug"
          element={
            <ProtectedRoute>
              <AdminProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-upload"
          element={
            <ProtectedRoute>
              <AdminAiUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/images"
          element={
            <ProtectedRoute>
              <AdminImageLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/default-layout"
          element={
            <ProtectedRoute>
              <AdminDefaultLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activations"
          element={
            <ProtectedRoute>
              <AdminActivations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activations/:id"
          element={
            <ProtectedRoute>
              <AdminActivationEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/collaborations"
          element={
            <ProtectedRoute>
              <AdminCollaborations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/collaborations/:brandSlug"
          element={
            <ProtectedRoute>
              <AdminCollaborationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/site-settings"
          element={
            <ProtectedRoute>
              <AdminSiteSettings />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/bottle/negroni" replace />} />

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
