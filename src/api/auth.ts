import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[getRole] RLS or query error, trying RPC fallback:', error.message);
    return await getRoleFallback(userId);
  }
  return (data?.role as UserRole) ?? 'client';
}

async function getRoleFallback(userId: string): Promise<UserRole> {
  const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });
  if (error) {
    console.error('[getRoleFallback] RPC also failed:', error.message);
    return 'client';
  }
  return (data as UserRole) ?? 'client';
}
