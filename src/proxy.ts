import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {  // 1. Create an unmodified response
  let supabaseResponse = NextResponse.next({ request });

  // 2. Initialize the modern Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the response cookies so the browser successfully receives them
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Securely check the current active session
  // getUser() asks Supabase to verify the token. getSession() only reads the
  // cookie, which a user can forge, so Supabase recommends getUser() on servers.
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 4. The Gateway Logic: Bounce unauthenticated users back to login
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Protect the API. Before this, anyone on the internet could POST to
  //    /api/adjudicate (spending your Gemini/Groq/Tavily credits) or to
  //    /api/knowledge/seed (writing whatever they liked into your knowledge base).
  const isProtectedApi = path.startsWith('/api/adjudicate') || path.startsWith('/api/knowledge');
  if (!user && isProtectedApi) {
    // The benchmark script authenticates with a shared secret instead of a login.
    const benchmarkSecret = process.env.BENCHMARK_SECRET;
    const sentSecret = request.headers.get('x-benchmark-secret');
    const isBenchmark =
      !!benchmarkSecret && sentSecret === benchmarkSecret && path.startsWith('/api/adjudicate');
    if (!isBenchmark) {
      return NextResponse.json({ error: 'Please log in to use the tribunal.' }, { status: 401 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};