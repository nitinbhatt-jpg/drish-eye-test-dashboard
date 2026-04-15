import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

const CLIENT_EMAILS = new Set([
  'abhishek.abhishek3@fos.lenskart.in',
  'shruti.shruti3@fos.lenskart.in',
  'shariq.rehan@fos.lenskart.in',
  'manisha.manisha1@fos.lenskart.in',
  'raman.ganguly@fos.lenskart.in',
  'debannita.pal@fos.lenskart.in',
  'pratik.sarkar@fos.lenskart.in',
  'rimi.das@fos.lenskart.in',
  'yogesh.kumar3@fos.lenskart.in',
  'priya.das@fos.lenskart.in',
]);

const ADMIN_EMAILS = new Set([
  'nitin.bhatt@lenskart.com',
  'shantanu.chandra@lenskart.com',
  'siddarth.gupta@lenskart.com',
  'harpratap.malhi@lenskart.in',
]);

const DEFAULT_PASSWORD = 'LK@123';

function isClientEmail(email: string): boolean {
  return CLIENT_EMAILS.has(email.toLowerCase().trim());
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

function isAllowedEmail(email: string): boolean {
  return isClientEmail(email) || isAdminEmail(email);
}

export async function signUp(email: string, password: string) {
  if (!isAllowedEmail(email)) {
    throw new Error('Signup is restricted to authorised emails only.');
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, _password?: string) {
  const normalised = email.toLowerCase().trim();

  if (!isAllowedEmail(normalised)) {
    throw new Error('This email is not authorised to access the dashboard.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalised,
    password: DEFAULT_PASSWORD,
  });

  if (!error) return data;

  // Only attempt auto-register for "Invalid login credentials" (user doesn't exist yet)
  if (error.message !== 'Invalid login credentials') {
    throw error;
  }

  const { error: signUpErr } = await supabase.auth.signUp({
    email: normalised,
    password: DEFAULT_PASSWORD,
  });
  if (signUpErr) throw signUpErr;

  const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
    email: normalised,
    password: DEFAULT_PASSWORD,
  });
  if (retryErr) throw retryErr;
  return retryData;
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
