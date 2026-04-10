import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export type AppRole = 'admin' | 'moderator' | 'user' | 'editor' | 'marketing' | 'supply';

export function useUserRoles() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    enabled: !!user?.id,
  });
}

export function useHasRole(...roles: AppRole[]) {
  const { data: userRoles, isLoading } = useUserRoles();
  const hasRole = userRoles?.some((r) => roles.includes(r)) ?? false;
  return { hasRole, isLoading };
}

/** Returns true if user has any admin-panel role */
export function useIsTeamMember() {
  return useHasRole('admin', 'editor', 'marketing', 'supply', 'moderator');
}

/** Permission map for nav items */
export function usePermissions() {
  const { data: roles, isLoading } = useUserRoles();
  const r = roles ?? [];
  const is = (role: AppRole) => r.includes(role);
  const isAdmin = is('admin');

  return {
    isLoading,
    roles: r,
    isAdmin,
    canManageProducts: isAdmin || is('editor'),
    canManageActivations: isAdmin || is('marketing'),
    canViewAnalytics: isAdmin || is('marketing'),
    canManageTechData: isAdmin || is('supply'),
    canManageImages: isAdmin || is('editor'),
    canManageLayout: isAdmin || is('editor'),
    canManageCollaborations: isAdmin,
    canManageSettings: isAdmin,
    canManageUsers: isAdmin,
    canAccessAdmin: r.length > 0,
  };
}
