import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useIsTeamMember } from '@/hooks/useUserRole';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const { hasRole: isTeam, isLoading: roleLoading } = useIsTeamMember();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-lg font-admin font-semibold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to access the admin panel.</p>
          <p className="text-xs text-muted-foreground">Contact your administrator to get a role assigned.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
