// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Notice we're removing the AuthCallbackResponse type since we're handling redirects
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect response doesn't need the AuthCallbackResponse type
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    // For error responses, we'll return a JSON response
    return NextResponse.json(
      { error: 'Authentication callback failed' },
      { status: 500 }
    );
  }
}