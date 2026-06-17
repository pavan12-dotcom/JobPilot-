import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect back to the main app — session is now stored in cookies/localStorage
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(`${origin}/?auth_error=true`);
}
