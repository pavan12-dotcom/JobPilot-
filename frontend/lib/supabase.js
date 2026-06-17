// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helpers
export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://aipilot-dusky.vercel.app/auth/callback';
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
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
