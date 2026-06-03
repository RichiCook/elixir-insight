import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AppRole } from '@/hooks/useUserRole';

const ALL_ROLES: AppRole[] = ['admin', 'editor', 'marketing', 'supply', 'moderator'];

const ROLE_LABELS: Record<AppRole, { label: string; description: string; color: string }> = {
  admin:     { label: 'Admin',     description: 'Full access',              color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  editor:    { label: 'Editor',    description: 'Products & content',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  marketing: { label: 'Marketing', description: 'Activations & analytics',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  supply:    { label: 'Supply',    description: 'Technical data',           color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  moderator: { label: 'Moderator', description: 'General moderation',       color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  user:      { label: 'User',      description: 'Basic access',             color: 'bg-muted text-muted-foreground border-border' },
};

interface UserWithRoles {
  user_id: string;
  email: string;
  roles: AppRole[];
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('editor');
  const [adding, setAdding] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles' as any);
      if (error) throw error;
      return (data ?? []) as UserWithRoles[];
    },
  });

  const handleAddRole = async () => {
    if (!newEmail) { toast.error('Email is required'); return; }
    setAdding(true);

    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email: newEmail, role: newRole },
    });

    setAdding(false);

    if (error) {
      // Extract message from FunctionsHttpError body if available
      let message = error.message;
      try {
        const parsed = await (error as any)?.context?.json?.();
        if (parsed?.error) message = parsed.error;
      } catch { /* ignore */ }
      toast.error(message);
      return;
    }

    toast.success(data?.message ?? `${newRole} role assigned to ${newEmail}`);
    setNewEmail('');
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ROLE_LABELS[role].label} role removed`);
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground">Assign roles to team members</p>
        </div>
        <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Role legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_ROLES.map((role) => (
            <div key={role} className="rounded-lg p-3" style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_LABELS[role].color}`}>
                {ROLE_LABELS[role].label}
              </span>
              <p className="text-[10px] text-muted-foreground mt-1.5">{ROLE_LABELS[role].description}</p>
            </div>
          ))}
        </div>

        {/* Assign role form */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-admin font-medium text-foreground">Assign Role</h2>
          <div className="flex gap-2">
            <Input
              placeholder="User email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
              className="flex-1"
            />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddRole} disabled={adding} className="bg-primary text-primary-foreground whitespace-nowrap">
              {adding ? 'Sending…' : 'Invite & Assign'}
            </Button>
          </div>
        </div>

        {/* Current users */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-admin font-medium text-foreground">
              Team Members
              {users && users.length > 0 && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">{users.length} user{users.length !== 1 ? 's' : ''}</span>
              )}
            </h2>
            {!users || users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
            ) : (
              users.map((u) => (
                <div key={u.user_id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{u.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {u.roles.map((role) => (
                        <span key={role} className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_LABELS[role]?.color ?? ''}`}>
                          {ROLE_LABELS[role]?.label ?? role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {u.roles.map((role) => (
                      <Button
                        key={role}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveRole(u.user_id, role)}
                      >
                        − {ROLE_LABELS[role]?.label ?? role}
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
