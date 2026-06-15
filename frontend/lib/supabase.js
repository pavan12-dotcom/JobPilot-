// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helpers
export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  if (!supabase) {
    localStorage.removeItem('applyai_token');
    localStorage.removeItem('applyai_user');
    return;
  }
  await supabase.auth.signOut();
  localStorage.removeItem('applyai_token');
  localStorage.removeItem('applyai_user');
}

export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
