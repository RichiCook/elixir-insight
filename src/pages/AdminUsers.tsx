import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AppRole } from '@/hooks/useUserRole';

const ALL_ROLES: AppRole[] = ['admin', 'editor', 'marketing', 'supply', 'moderator', 'user'];

const ROLE_LABELS: Record<AppRole, { label: string; description: string; color: string }> = {
  admin: { label: 'Admin', description: 'Full access', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  editor: { label: 'Editor', description: 'Products & content', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  marketing: { label: 'Marketing', description: 'Activations & analytics', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  supply: { label: 'Supply', description: 'Technical data', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  moderator: { label: 'Moderator', description: 'General moderation', color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  user: { label: 'User', description: 'Basic access', color: 'bg-muted text-muted-foreground border-border' },
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('editor');
  const [adding, setAdding] = useState(false);

  const { data: roleEntries, isLoading } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Group roles by user_id
  const userMap = (roleEntries ?? []).reduce<Record<string, { roles: { id: string; role: AppRole }[] }>>((acc, entry) => {
    if (!acc[entry.user_id]) acc[entry.user_id] = { roles: [] };
    acc[entry.user_id].roles.push({ id: entry.id, role: entry.role as AppRole });
    return acc;
  }, {});

  const handleAddRole = async () => {
    if (!newEmail) { toast.error('Email is required'); return; }
    setAdding(true);

    // Look up user by email via an edge-function or RPC — for now we'll use
    // a simple approach: the admin enters the user_id directly or email
    // We'll try to find via auth admin API through an RPC
    const { data: userId, error: lookupErr } = await supabase.rpc('get_user_id_by_email' as any, { _email: newEmail });

    if (lookupErr || !userId) {
      toast.error('User not found. They must sign up first.');
      setAdding(false);
      return;
    }

    const { error } = await supabase.from('user_roles').insert({
      user_id: userId as string,
      role: newRole,
    });

    setAdding(false);
    if (error) {
      if (error.message.includes('duplicate')) toast.error('User already has this role');
      else toast.error(error.message);
      return;
    }
    toast.success(`${newRole} role assigned`);
    setNewEmail('');
    queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
  };

  const handleRemoveRole = async (id: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Role removed');
    queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
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
          {ALL_ROLES.filter(r => r !== 'user').map((role) => (
            <div key={role} className="rounded-lg p-3" style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_LABELS[role].color}`}>
                {ROLE_LABELS[role].label}
              </span>
              <p className="text-[10px] text-muted-foreground mt-1.5">{ROLE_LABELS[role].description}</p>
            </div>
          ))}
        </div>

        {/* Add role form */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-admin font-medium text-foreground">Assign Role</h2>
          <div className="flex gap-2">
            <Input
              placeholder="User email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.filter(r => r !== 'user').map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddRole} disabled={adding} className="bg-primary text-primary-foreground">
              {adding ? 'Adding…' : 'Assign'}
            </Button>
          </div>
        </div>

        {/* Current roles */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-admin font-medium text-foreground">Current Assignments</h2>
            {Object.entries(userMap).length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
            ) : (
              Object.entries(userMap).map(([userId, { roles }]) => (
                <div key={userId} className="rounded-lg border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{userId.slice(0, 8)}…</p>
                    <div className="flex gap-1.5 mt-1">
                      {roles.map((r) => (
                        <span key={r.id} className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_LABELS[r.role].color}`}>
                          {ROLE_LABELS[r.role].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {roles.map((r) => (
                      <Button key={r.id} variant="ghost" size="sm" className="text-xs text-destructive"
                        onClick={() => handleRemoveRole(r.id)}>
                        Remove {ROLE_LABELS[r.role].label}
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
