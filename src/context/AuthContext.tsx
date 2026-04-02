import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getRole } from '@/api/auth';
import type { UserRole } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  async function loadProfile(userId: string) {
    try {
      const role = await getRole(userId);
      console.log('[Auth] Role loaded:', role);
      setState((prev) => ({ ...prev, role, loading: false }));
    } catch (err) {
      console.error('[Auth] Failed to load role, defaulting to client:', err);
      setState((prev) => ({ ...prev, role: 'client', loading: false }));
    }
  }

  async function refreshProfile() {
    if (state.user) {
      await loadProfile(state.user.id);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user, session }));
        loadProfile(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setState((prev) => ({ ...prev, user, session }));
        if (user) {
          loadProfile(user.id);
        } else {
          setState((prev) => ({ ...prev, role: null, loading: false }));
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
