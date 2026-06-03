import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialize: () => void;
  cleanup: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

// Module-level reference so cleanup() can unsubscribe the listener
// regardless of which component calls it.
let _unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: () => {
    // Set up the realtime auth listener first so we never miss a transition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
    _unsubscribe = () => subscription.unsubscribe();

    // Hydrate from the persisted session (localStorage) immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
  },

  // Call this from the useEffect cleanup in AppInner to avoid listener leaks
  // across hot-reloads and StrictMode double-invocations.
  cleanup: () => {
    _unsubscribe?.();
    _unsubscribe = null;
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null, user: data.user };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
